/**
 * Erzeugt die Bild-Assets für WhatsApp Business.
 *
 * Gerendert wird mit Chromium (HTML/CSS in der echten Hausschrift) und
 * anschliessend mit sharp auf die Zielgroesse heruntergerechnet – dadurch sind
 * Kanten und Schrift sauber, statt bei der Zielaufloesung direkt zu rastern.
 */
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import sharp from '../../node_modules/sharp/dist/index.cjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../..', import.meta.url));
const OUT = process.env.OUT || join(REPO, 'marken-assets/whatsapp');
mkdirSync(OUT, { recursive: true });

const TRUCK = readFileSync(join(REPO, 'src/assets/ub-truck.svg'), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '')
  .replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');

const F = {
  espresso: '#2A2019',
  ink: '#241D17',
  accent: '#E87B2E',
  accentDark: '#D26A22',
  tint: '#FBEEE0',
  creme: '#FFF8F1',
  wa: '#25D366',
};

const KONTAKT = {
  telefon: '0178 4444 156',
  wa: 'wa.me/491784444156',
  web: 'umzuege-bergstrasse.de',
  orte: 'Reichelsheim & Bensheim',
  zeiten: 'Mo–Sa 8–20 Uhr',
};

/** Wortmarke wie auf der Website: zwei Zeilen, exakt gleich breit. */
function wortmarke(hoehe, farbe = '#fff') {
  return `<svg viewBox="0 0 196 64" style="height:${hoehe}px;width:auto;display:block;font-family:'Hanken Grotesk',sans-serif" fill="${farbe}">
    <text x="0" y="31" textLength="196" lengthAdjust="spacing" font-weight="800" font-size="31">UMZÜGE</text>
    <text x="0" y="60" textLength="196" lengthAdjust="spacing" font-weight="800" font-size="20.5">BERGSTRASSE</text>
  </svg>`;
}

/** Truck-Logo in beliebiger Farbe und Hoehe. */
function truck(hoehe, farbe = F.accent, extra = '') {
  return `<span style="color:${farbe};display:block;height:${hoehe}px;${extra}">
    ${TRUCK.replace('<svg ', `<svg style="height:100%;width:auto;display:block" `)}
  </span>`;
}

/** Logo-Sperre: Truck + Wortmarke nebeneinander. */
function logo(hoehe, textFarbe = '#fff', truckFarbe = F.accent) {
  return `<span style="display:inline-flex;align-items:center;gap:${hoehe * 0.28}px">
    ${truck(hoehe, truckFarbe)}${wortmarke(hoehe, textFarbe)}
  </span>`;
}

const BASIS = `
  @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; }
  body { font-family:'Hanken Grotesk', system-ui, sans-serif; -webkit-font-smoothing:antialiased; }
  .flaeche { position:relative; overflow:hidden; width:100vw; height:100vh; }
`;

let browser;
async function rendern(name, breite, hoehe, html, css = '', skala = 2) {
  const seite = await browser.newPage({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: skala });
  await seite.setContent(
    `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${BASIS}${css}</style></head>
     <body><div class="flaeche">${html}</div></body></html>`,
    { waitUntil: 'networkidle' },
  );
  await seite.evaluate(() => document.fonts.ready);
  await seite.waitForTimeout(150);
  const gross = await seite.screenshot({ type: 'png' });
  await seite.close();
  const ziel = join(OUT, `${name}.png`);
  await sharp(gross).resize(breite, hoehe, { fit: 'fill' }).png({ compressionLevel: 9 }).toFile(ziel);
  console.log('  ', `${name}.png`, `${breite}×${hoehe}`);
  return ziel;
}

/* ============================ TITELBILD ============================
   16:9. Alles Wichtige liegt im oberen Bereich: Das Profilbild wird vom
   Titelbild ueberlagert, und wo genau, haengt von App-Version und Geraet ab.
   Die untere Haelfte bleibt deshalb reine Markenflaeche. */
function titelbild({ dunkel = true } = {}) {
  const bg = dunkel ? F.espresso : F.tint;
  const text = dunkel ? '#fff' : F.espresso;
  const leise = dunkel ? 'rgba(255,255,255,.62)' : 'rgba(42,32,25,.66)';
  const schatten = dunkel ? 'rgba(255,255,255,.055)' : 'rgba(42,32,25,.06)';
  return {
    html: `
      <div class="bg"></div>
      <div class="glanz"></div>
      <div class="truck">${truck(290, schatten)}</div>
      <div class="kante"></div>
      <div class="inhalt">
        ${logo(96, text, F.accent)}
        <div class="claim">Umzüge &amp; Entrümpelung<br>an der Bergstraße</div>
        <div class="zeile">${KONTAKT.orte} &middot; ${KONTAKT.zeiten} &middot; ${KONTAKT.telefon}</div>
      </div>`,
    css: `
      .bg { position:absolute; inset:0; background:${bg}; }
      .glanz { position:absolute; inset:0;
        background: radial-gradient(120% 90% at 88% 6%, ${F.accent}38 0%, transparent 58%); }
      .truck { position:absolute; right:5%; top:9%; display:flex; }
      .inhalt { position:absolute; left:6.2%; top:9%; right:34%; color:${text}; }
      .claim { margin-top:34px; font-size:46px; font-weight:800; line-height:1.14; letter-spacing:-.015em; }
      .zeile { margin-top:26px; font-size:22px; font-weight:600; color:${leise}; white-space:nowrap; }
      .kante { position:absolute; left:0; right:0; bottom:0; height:7px; background:${F.accent}; }
    `,
  };
}

/* ============================ PROFILBILD (Logo) ============================
   WhatsApp beschneidet kreisrund. Das Motiv bleibt deshalb innerhalb eines
   gedachten Kreises von 78% Kantenlaenge. */
function profilLogo() {
  return {
    html: `
      <div class="bg"></div>
      <div class="ring"></div>
      <div class="mitte">${truck(430, F.accent)}</div>`,
    css: `
      .bg { position:absolute; inset:0; background:
        radial-gradient(90% 80% at 50% 18%, #3a2c22 0%, ${F.espresso} 62%); }
      .ring { position:absolute; inset:5.5%; border-radius:50%;
        border:3px solid rgba(232,123,46,.22); }
      .mitte { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
    `,
  };
}

/* ============================ KATALOG-KACHELN ============================ */
const LEISTUNGEN = [
  {
    datei: 'katalog-privatumzug',
    titel: 'Privatumzug',
    zeile: 'Sorgfältig verpackt, sicher transportiert, am neuen Ort wieder aufgebaut.',
    punkte: ['Kostenlose Besichtigung', 'Verbindlicher Festpreis', 'Kartons werden gestellt'],
  },
  {
    datei: 'katalog-firmenumzug',
    titel: 'Firmenumzug',
    zeile: 'Büro- und Betriebsumzüge mit minimaler Ausfallzeit – auch abends und samstags.',
    punkte: ['Fester Zeitplan', 'Arbeitsplätze beschriftet', 'IT sicher verpackt'],
  },
  {
    datei: 'katalog-entruempelung',
    titel: 'Entrümpelung',
    zeile: 'Wohnung, Keller, Dachboden oder komplette Haushaltsauflösung – diskret und besenrein.',
    punkte: ['Diskret und zügig', 'Besenrein übergeben', 'Wertanrechnung senkt den Preis'],
  },
  {
    datei: 'katalog-entsorgung',
    titel: 'Entsorgung',
    zeile: 'Sperrmüll, Altmöbel und Elektrogeräte fachgerecht und umweltbewusst entsorgt.',
    punkte: ['Abholung vor Ort', 'Nach Wertstoffen getrennt', 'Zertifizierte Betriebe'],
  },
];

function katalog(l) {
  return {
    html: `
      <div class="bg"></div>
      <div class="truck">${truck(300, 'rgba(255,255,255,.06)')}</div>
      <div class="kopf">${logo(58)}</div>
      <div class="inhalt">
        <div class="strich"></div>
        <div class="titel">${l.titel}</div>
        <div class="zeile">${l.zeile}</div>
        <ul>${l.punkte.map((p) => `<li><span class="haken">✓</span>${p}</li>`).join('')}</ul>
      </div>
      <div class="fuss">${KONTAKT.orte} · ${KONTAKT.telefon}</div>`,
    css: `
      .bg { position:absolute; inset:0; background:
        radial-gradient(110% 70% at 82% 0%, #3b2d23 0%, ${F.espresso} 60%); }
      .truck { position:absolute; right:56px; bottom:44px; display:flex; }
      .kopf { position:absolute; left:64px; top:60px; }
      .inhalt { position:absolute; left:64px; right:64px; top:250px; color:#fff; }
      .strich { width:74px; height:7px; border-radius:4px; background:${F.accent}; }
      .titel { margin-top:28px; font-size:86px; font-weight:800; letter-spacing:-.025em; line-height:1; }
      .zeile { margin-top:24px; font-size:31px; line-height:1.4; color:rgba(255,255,255,.66); max-width:86%; }
      ul { margin-top:44px; list-style:none; display:flex; flex-direction:column; gap:20px; }
      li { display:flex; align-items:center; gap:16px; font-size:30px; font-weight:600; }
      .haken { color:${F.accent}; font-size:34px; font-weight:800; }
      .fuss { position:absolute; left:64px; bottom:56px; font-size:26px; font-weight:600;
        color:rgba(255,255,255,.5); }
    `,
  };
}

/* ============================ STATUS (9:16) ============================ */
function statusErreichbar() {
  return {
    html: `
      <div class="bg"></div>
      <div class="truck">${truck(360, 'rgba(255,255,255,.05)')}</div>
      <div class="kopf">${logo(76)}</div>
      <div class="mitte">
        <div class="strich"></div>
        <div class="gross">Umzug oder<br>Entrümpelung?</div>
        <div class="klein">Schreiben Sie uns einfach auf WhatsApp – Fotos vom Keller genügen, ein Angebot kommt meist noch am selben Tag.</div>
        <div class="knopf">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
               stroke-linecap="round" stroke-linejoin="round" class="hoerer">
            <path d="M4 5c0 8 7 15 15 15l0-3-4-2-2 2c-2-1-5-4-6-6l2-2-2-4z"></path>
          </svg>${KONTAKT.telefon}
        </div>
        <div class="unter">${KONTAKT.web}</div>
      </div>
      <div class="fuss">${KONTAKT.orte} · ${KONTAKT.zeiten}</div>`,
    css: `
      .bg { position:absolute; inset:0; background:
        radial-gradient(90% 46% at 50% 4%, #40301f 0%, ${F.espresso} 58%); }
      .truck { position:absolute; right:-40px; bottom:230px; display:flex; }
      .kopf { position:absolute; left:84px; top:120px; }
      .mitte { position:absolute; left:84px; right:84px; top:27%; color:#fff; }
      .strich { width:92px; height:9px; border-radius:5px; background:${F.accent}; }
      .gross { margin-top:44px; font-size:104px; font-weight:800; line-height:1.06; letter-spacing:-.028em; }
      .klein { margin-top:36px; font-size:37px; line-height:1.48; color:rgba(255,255,255,.66); }
      .knopf { margin-top:62px; display:inline-flex; align-items:center; gap:22px;
        background:${F.accent}; color:#fff; font-size:46px; font-weight:800;
        padding:30px 52px; border-radius:999px; }
      .hoerer { width:46px; height:46px; }
      .unter { margin-top:30px; font-size:34px; font-weight:600; color:rgba(255,255,255,.5); }
      .fuss { position:absolute; left:84px; bottom:130px; font-size:32px; font-weight:600;
        color:rgba(255,255,255,.42); }
    `,
  };
}

function statusVersprechen() {
  const punkte = [
    ['Kostenlose Besichtigung', 'Wir schauen uns alles vor Ort an – ohne Kosten und ohne Verpflichtung.'],
    ['Festpreis, schriftlich', 'Was im Angebot steht, gilt. Keine Nachforderungen am Umzugstag.'],
    ['Ein Ansprechpartner', 'Wer bei uns anruft, spricht mit mir – und ich bin am Umzugstag dabei.'],
  ];
  return {
    html: `
      <div class="bg"></div>
      <div class="kopf">${logo(76, F.espresso, F.accent)}</div>
      <div class="mitte">
        <div class="gross">Drei Dinge,<br>auf die Sie sich<br>verlassen können</div>
        ${punkte
          .map(
            ([t, s], i) => `<div class="karte">
              <div class="nr">${i + 1}</div>
              <div><div class="kt">${t}</div><div class="ks">${s}</div></div>
            </div>`,
          )
          .join('')}
      </div>
      <div class="fuss">${KONTAKT.telefon} · ${KONTAKT.web}</div>`,
    css: `
      .bg { position:absolute; inset:0; background:${F.tint}; }
      .kopf { position:absolute; left:84px; top:120px; }
      .mitte { position:absolute; left:84px; right:84px; top:330px; color:${F.espresso}; }
      .gross { font-size:88px; font-weight:800; line-height:1.08; letter-spacing:-.028em; }
      .karte { margin-top:46px; display:flex; gap:32px; align-items:flex-start;
        background:#fff; border-radius:34px; padding:44px 40px; }
      .nr { flex:none; width:72px; height:72px; border-radius:50%; background:${F.accent};
        color:#fff; font-size:38px; font-weight:800; display:flex; align-items:center; justify-content:center; }
      .kt { font-size:42px; font-weight:800; letter-spacing:-.01em; }
      .ks { margin-top:14px; font-size:32px; line-height:1.45; color:rgba(42,32,25,.64); }
      .fuss { position:absolute; left:84px; bottom:130px; font-size:32px; font-weight:700;
        color:rgba(42,32,25,.5); }
    `,
  };
}

/* ============================ AUSFUEHRUNG ============================ */
browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });

console.log('Titelbilder');
const t = titelbild({ dunkel: true });
await rendern('titelbild', 1211, 681, t.html, t.css);
await rendern('titelbild-gross', 1920, 1080, t.html, t.css, 1);
const th = titelbild({ dunkel: false });
await rendern('titelbild-hell', 1211, 681, th.html, th.css);

console.log('Profilbild (Logo)');
const pl = profilLogo();
await rendern('profilbild-logo', 1080, 1080, pl.html, pl.css);

console.log('Katalog');
for (const l of LEISTUNGEN) {
  const k = katalog(l);
  await rendern(l.datei, 1024, 1024, k.html, k.css);
}

console.log('Status');
const s1 = statusErreichbar();
await rendern('status-erreichbar', 1080, 1920, s1.html, s1.css, 1);
const s2 = statusVersprechen();
await rendern('status-versprechen', 1080, 1920, s2.html, s2.css, 1);

await browser.close();
console.log('fertig →', OUT);
