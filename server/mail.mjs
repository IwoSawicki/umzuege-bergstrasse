/**
 * Mail-Endpunkt für die Anfrageformulare.
 *
 * Ersetzt FormSubmit.co. Gründe für den Wechsel: Der Dienst hat den Versand
 * wiederholt mit HTTP 500 abgewiesen, die Ursache liess sich von aussen nicht
 * feststellen, und jede Anfrage lief ueber einen US-Anbieter. Hier laeuft
 * alles auf dem eigenen Server – kein Drittanbieter, keine Freischaltung,
 * keine fremde Spam-Heuristik, die uns aussperrt.
 *
 * Laeuft als kleiner HTTP-Dienst hinter nginx (siehe nginx.conf, /api/).
 * nginx bleibt vorne und behaelt Gzip, Caching und Security-Header.
 *
 * Konfiguration ueber Umgebungsvariablen – siehe DEPLOY.md.
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import nodemailer from 'nodemailer';

const PORT = Number(process.env.MAIL_PORT || 8081);
const HOST = process.env.MAIL_HOST_BIND || '127.0.0.1';

/* Fertige Einstellungen der gaengigen Anbieter. Spart drei Variablen und
   die haeufigste Fehlerquelle: Port 587 braucht secure=false (STARTTLS),
   Port 465 braucht secure=true (SMTPS). Wer die Werte selbst setzt,
   ueberschreibt den Voreinstellungssatz. */
const ANBIETER = {
  gmail:     { host: 'smtp.gmail.com',      port: 587, secure: false },
  google:    { host: 'smtp.gmail.com',      port: 587, secure: false },
  ionos:     { host: 'smtp.ionos.de',       port: 587, secure: false },
  strato:    { host: 'smtp.strato.de',      port: 587, secure: false },
  hetzner:   { host: 'mail.your-server.de', port: 587, secure: false },
  mailbox:   { host: 'smtp.mailbox.org',    port: 465, secure: true },
  office365: { host: 'smtp.office365.com',  port: 587, secure: false },
};
const voreinstellung = ANBIETER[String(process.env.MAIL_PRESET || '').toLowerCase()] || {};

const SMTP = {
  host: process.env.SMTP_HOST || voreinstellung.host || '',
  port: Number(process.env.SMTP_PORT || voreinstellung.port || 587),
  user: process.env.SMTP_USER || '',
  // Google zeigt App-Passwoerter in Viererbloecken an ("abcd efgh ijkl mnop").
  // Beim Kopieren wandern die Leerzeichen mit – Google erwartet sie ohne.
  pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
  /** true = SMTPS auf Port 465, false = STARTTLS auf 587 */
  secure:
    process.env.SMTP_SECURE !== undefined
      ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
      : Boolean(voreinstellung.secure),
};
const MAIL_TO = process.env.MAIL_TO || process.env.SMTP_USER || '';
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || '';
/** Nur Anfragen von der eigenen Seite annehmen. Mehrere durch Komma trennen. */
const ERLAUBTE_HERKUNFT = (process.env.ALLOWED_ORIGINS || 'https://umzuege-bergstrasse.de')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
/** 'json' schreibt die Mail nur ins Log, statt sie zu versenden – für Tests. */
const TRANSPORT = process.env.MAIL_TRANSPORT || 'smtp';

/** Optional: statische Dateien mitausliefern.
    Im Docker-Betrieb macht das nginx, dann bleibt die Variable leer. Wird die
    App dagegen ohne nginx gestartet (z. B. Build-Type "Nixpacks" in Dokploy),
    gaebe es sonst zwar die Seite, aber kein /api/ – und die Formulare liefen
    wieder still ins Leere. Genau dieser Zustand hat hier schon einmal
    wochenlang niemandem auffallen koennen. */
const STATIC_DIR = process.env.SERVE_STATIC || '';

const MAX_BODY = 32 * 1024; // 32 KB reichen für jedes dieser Formulare
const FELDER = ['name', 'telefon', 'email', 'nachricht', 'leistung', 'quelle'];

const transporter =
  TRANSPORT === 'json'
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport({
        host: SMTP.host,
        port: SMTP.port,
        secure: SMTP.secure,
        auth: SMTP.user ? { user: SMTP.user, pass: SMTP.pass } : undefined,
      });

/* ---- Zustand der SMTP-Anmeldung -------------------------------------------
   Ob Host und Passwort gesetzt sind, sagt noch nicht, ob der Mailserver sie
   akzeptiert. Genau das war hier die offene Frage, und im Log nachzusehen ist
   umstaendlich. Also merken wir uns das Ergebnis und geben es unter
   /api/health mit aus. */
let anmeldung = TRANSPORT === 'json' ? 'testmodus' : 'noch nicht geprueft';

/** Entfernt Benutzername und Passwort aus einer Fehlermeldung. Manche Server
    zitieren die Anmeldedaten in ihrer Antwort, und /api/health ist oeffentlich. */
function ohneGeheimnisse(text) {
  let t = String(text || '');
  for (const geheim of [SMTP.pass, SMTP.user].filter((g) => g && g.length > 3)) {
    t = t.split(geheim).join('***');
  }
  return t.slice(0, 300);
}

async function anmeldungPruefen() {
  if (TRANSPORT === 'json') return (anmeldung = 'testmodus');
  if (!SMTP.host) return (anmeldung = 'FEHLER: SMTP_HOST fehlt');
  try {
    await transporter.verify();
    anmeldung = 'in Ordnung';
  } catch (fehler) {
    anmeldung = `FEHLER: ${ohneGeheimnisse(fehler?.message || fehler)}`;
    console.error('[Mail] SMTP-Zugang FEHLERHAFT:', anmeldung);
  }
  return anmeldung;
}

/* ---- einfache Ratenbegrenzung je IP ---------------------------------------
   Haelt Massenversand ab, ohne einen Dienst von aussen einzubinden. Bewusst
   im Arbeitsspeicher: bei einem Neustart ist die Liste leer, das ist hier
   folgenlos. */
const FENSTER_MS = 10 * 60 * 1000;
const MAX_PRO_FENSTER = 10;
const verlauf = new Map();

function zuVieleAnfragen(ip) {
  const jetzt = Date.now();
  const bisher = (verlauf.get(ip) || []).filter((t) => jetzt - t < FENSTER_MS);
  bisher.push(jetzt);
  verlauf.set(ip, bisher);
  if (verlauf.size > 5000) verlauf.clear(); // simpler Schutz gegen Speicherwachstum
  return bisher.length > MAX_PRO_FENSTER;
}

function koerperLesen(req) {
  return new Promise((auf, ab) => {
    let daten = '';
    let laenge = 0;
    req.on('data', (stueck) => {
      laenge += stueck.length;
      if (laenge > MAX_BODY) {
        ab(new Error('zu gross'));
        req.destroy();
        return;
      }
      daten += stueck;
    });
    req.on('end', () => auf(daten));
    req.on('error', ab);
  });
}

function felderLesen(roh, contentType) {
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(roh);
    } catch {
      return {};
    }
  }
  const out = {};
  for (const [k, v] of new URLSearchParams(roh)) out[k] = v;
  return out;
}

function saeubern(wert) {
  // Zeilenumbrueche in Kopfzeilen wuerden Header-Injection erlauben
  return String(wert ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 2000);
}

function antwort(res, status, daten, herkunft) {
  const kopf = { 'Content-Type': 'application/json; charset=utf-8' };
  if (herkunft) {
    kopf['Access-Control-Allow-Origin'] = herkunft;
    kopf['Vary'] = 'Origin';
  }
  res.writeHead(status, kopf);
  res.end(JSON.stringify(daten));
}

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

/** Liefert eine Datei aus STATIC_DIR aus. Gibt false zurueck, wenn es sie nicht
    gibt – der Status wird uebergeben, damit die 404-Seite auch als 404 geht.
    Wichtig: writeHead darf erst hier passieren, nicht schon beim Aufrufer. */
function dateiAusliefern(pfad, res, status = 200) {
  const sicher = normalize(pfad).replace(/^(\.\.[/\\])+/, ''); // kein Ausbruch aus dem Verzeichnis
  let datei = join(STATIC_DIR, sicher);
  try {
    if (statSync(datei).isDirectory()) datei = join(datei, 'index.html');
  } catch {
    // Astro baut mit format:'directory' – /impressum liegt als /impressum/index.html
    try {
      statSync(join(STATIC_DIR, sicher, 'index.html'));
      datei = join(STATIC_DIR, sicher, 'index.html');
    } catch {
      return false;
    }
  }
  try {
    statSync(datei);
  } catch {
    return false;
  }
  const typ = TYPEN[extname(datei).toLowerCase()] || 'application/octet-stream';
  res.writeHead(status, { 'Content-Type': typ });
  createReadStream(datei).pipe(res);
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (url.pathname === '/api/health') {
    // Bewusst ohne Hostnamen oder Zugangsdaten – nur, ob eingerichtet ist.
    // /api/health?pruefen=1 fragt den Mailserver frisch, statt den beim Start
    // gemerkten Zustand zu zeigen.
    if (url.searchParams.has('pruefen')) await anmeldungPruefen();
    return antwort(res, 200, {
      ok: true,
      transport: TRANSPORT,
      smtp: TRANSPORT === 'json' ? 'testmodus' : SMTP.host ? 'konfiguriert' : 'FEHLT',
      passwort: TRANSPORT === 'json' ? 'testmodus' : SMTP.pass ? 'gesetzt' : 'FEHLT',
      ziel: MAIL_TO ? 'gesetzt' : 'FEHLT',
      anmeldung,
    });
  }
  if (url.pathname !== '/api/anfrage') {
    if (STATIC_DIR && req.method === 'GET') {
      if (dateiAusliefern(decodeURIComponent(url.pathname), res)) return;
      if (dateiAusliefern('/404.html', res, 404)) return;
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Nicht gefunden');
    }
    return antwort(res, 404, { ok: false, fehler: 'Unbekannter Pfad' });
  }

  const herkunft = (req.headers.origin || '').replace(/\/$/, '');
  const herkunftErlaubt = !herkunft || ERLAUBTE_HERKUNFT.includes(herkunft);

  if (req.method === 'OPTIONS') {
    res.writeHead(herkunftErlaubt ? 204 : 403, {
      'Access-Control-Allow-Origin': herkunftErlaubt ? herkunft : '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }
  if (req.method !== 'POST') {
    return antwort(res, 405, { ok: false, fehler: 'Nur POST' });
  }
  if (!herkunftErlaubt) {
    return antwort(res, 403, { ok: false, fehler: 'Herkunft nicht erlaubt' });
  }

  // nginx reicht die echte IP per X-Forwarded-For durch
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress || 'unbekannt';
  if (zuVieleAnfragen(ip)) {
    return antwort(res, 429, { ok: false, fehler: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, herkunft);
  }

  let roh;
  try {
    roh = await koerperLesen(req);
  } catch {
    return antwort(res, 413, { ok: false, fehler: 'Anfrage zu gross' }, herkunft);
  }

  const daten = felderLesen(roh, String(req.headers['content-type'] || ''));
  const f = {};
  for (const name of FELDER) f[name] = saeubern(daten[name]);

  if (!f.name || !f.telefon) {
    return antwort(res, 400, { ok: false, fehler: 'Name und Telefonnummer werden benötigt.' }, herkunft);
  }

  const betreff = saeubern(daten._subject) || `Neue Anfrage über umzuege-bergstrasse.de`;
  const zeilen = [
    `Name:      ${f.name}`,
    `Telefon:   ${f.telefon}`,
    f.email ? `E-Mail:    ${f.email}` : null,
    f.leistung ? `Leistung:  ${f.leistung}` : null,
    f.quelle ? `Quelle:    ${f.quelle}` : null,
    '',
    'Nachricht:',
    f.nachricht || '(keine)',
    '',
    '---',
    `Eingegangen: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
  ].filter((z) => z !== null);

  try {
    const info = await transporter.sendMail({
      from: `"Umzüge Bergstraße" <${MAIL_FROM}>`,
      to: MAIL_TO,
      // Antworten gehen direkt an den Interessenten, sofern er eine Mail angab
      replyTo: f.email || undefined,
      subject: betreff,
      text: zeilen.join('\n'),
    });
    if (TRANSPORT === 'json') console.log('[Mail] (Testmodus, nicht versendet)', info.message);
    else console.log(`[Mail] versendet an ${MAIL_TO} – ${betreff}`);
    return antwort(res, 200, { ok: true }, herkunft);
  } catch (fehler) {
    console.error('[Mail] Versand fehlgeschlagen:', fehler?.message || fehler);
    return antwort(res, 502, { ok: false, fehler: 'Versand fehlgeschlagen' }, herkunft);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[Mail] bereit auf http://${HOST}:${PORT} – Transport: ${TRANSPORT}, Ziel: ${MAIL_TO || '(nicht gesetzt)'}`);
  if (STATIC_DIR) console.log(`[Mail] liefert zusaetzlich statische Dateien aus ${STATIC_DIR} aus.`);
  /* Beim Start protokollieren, welche der erwarteten Variablen ueberhaupt
     ankommen – nur die Namen, nie die Werte. Ohne das laesst sich "alles
     FEHLT" nicht unterscheiden von "falsch geschrieben" oder "gar nicht
     durchgereicht". */
  const erwartet = ['MAIL_PRESET', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER',
                    'SMTP_PASS', 'MAIL_TO', 'MAIL_FROM', 'ALLOWED_ORIGINS'];
  const da = erwartet.filter((n2) => process.env[n2]);
  const fehlt = erwartet.filter((n2) => !process.env[n2]);
  console.log('[Mail] Variablen vorhanden:', da.length ? da.join(', ') : '– KEINE –');
  console.log('[Mail] Variablen fehlen   :', fehlt.join(', ') || '–');
  if (!da.length) {
    console.warn(
      '[Mail] Es ist KEINE der erwarteten Variablen angekommen. Das deutet darauf hin,\n' +
      '       dass sie in Dokploy zwar gespeichert, aber noch nicht neu deployt wurden,\n' +
      '       oder dass sie unter "Build Arguments" statt unter "Environment" stehen.',
    );
  }

  if (TRANSPORT === 'smtp' && !SMTP.host) {
    console.warn('[Mail] WARNUNG: SMTP_HOST ist nicht gesetzt – der Versand wird scheitern.');
  } else if (TRANSPORT === 'smtp') {
    // Zugangsdaten sofort pruefen, nicht erst bei der ersten echten Anfrage
    anmeldungPruefen().then((zustand) => console.log('[Mail] SMTP-Zugang:', zustand));
  }
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
