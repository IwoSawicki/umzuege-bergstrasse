/**
 * Zweiter Teil: Profilbild-Varianten mit Marke, QR-Code und QR-Karte.
 */
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import sharp from '../../node_modules/sharp/dist/index.cjs';
// Nur zum Erzeugen noetig: npm i qrcode
import QR from 'qrcode';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../..', import.meta.url));
const OUT = join(REPO, 'marken-assets/whatsapp');
mkdirSync(OUT, { recursive: true });

const F = { espresso: '#2A2019', accent: '#E87B2E', tint: '#FBEEE0' };
const WA_LINK = 'https://wa.me/491784444156';

const TRUCK = readFileSync(join(REPO, 'src/assets/ub-truck.svg'), 'utf8').replace(/<\?xml[^>]*\?>/, '');
const FOTO = 'data:image/jpeg;base64,' + readFileSync(join(OUT, 'profilbild-iwo.jpg')).toString('base64');

function truck(hoehe, farbe) {
  return `<span style="color:${farbe};display:block;height:${hoehe}px">
    ${TRUCK.replace('<svg ', '<svg style="height:100%;width:auto;display:block" ')}</span>`;
}
function wortmarke(hoehe, farbe) {
  return `<svg viewBox="0 0 196 64" style="height:${hoehe}px;width:auto;display:block;font-family:'Hanken Grotesk',sans-serif" fill="${farbe}">
    <text x="0" y="31" textLength="196" lengthAdjust="spacing" font-weight="800" font-size="31">UMZÜGE</text>
    <text x="0" y="60" textLength="196" lengthAdjust="spacing" font-weight="800" font-size="20.5">BERGSTRASSE</text>
  </svg>`;
}

const BASIS = `
  @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; }
  body { font-family:'Hanken Grotesk', system-ui, sans-serif; -webkit-font-smoothing:antialiased; }
  .flaeche { position:relative; overflow:hidden; width:100vw; height:100vh; }
`;

let browser;
async function rendern(name, b, h, html, css = '', skala = 2) {
  const s = await browser.newPage({ viewport: { width: b, height: h }, deviceScaleFactor: skala });
  await s.setContent(
    `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${BASIS}${css}</style></head><body><div class="flaeche">${html}</div></body></html>`,
    { waitUntil: 'networkidle' },
  );
  await s.evaluate(() => document.fonts.ready);
  await s.waitForTimeout(150);
  const png = await s.screenshot({ type: 'png' });
  await s.close();
  const foto = name.startsWith('profilbild-iwo');
  const datei = join(OUT, `${name}.${foto ? 'jpg' : 'png'}`);
  const bild = sharp(png).resize(b, h, { fit: 'fill' });
  await (foto ? bild.jpeg({ quality: 92, chromaSubsampling: '4:4:4' }) : bild.png({ compressionLevel: 9 })).toFile(datei);
  console.log('  ', datei.split('/').pop(), `${b}×${h}`);
}

browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });

/* Foto mit Markenring: Der Ring liegt innerhalb des Kreises, den WhatsApp
   beschneidet, und bleibt deshalb auch in der Chatliste sichtbar – anders als
   ein Logo, das bei 50 Pixel zu einem Fleck wird. */
await rendern(
  'profilbild-iwo-ring',
  1080,
  1080,
  `<img src="${FOTO}" class="foto"><div class="ring"></div>`,
  `.foto { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
   .ring { position:absolute; inset:0; border-radius:50%; border:26px solid ${F.accent}; }`,
);

/* Foto mit Logo-Badge unten – auf Wunsch, aber siehe Hinweis in der Anleitung. */
await rendern(
  'profilbild-iwo-logo',
  1080,
  1080,
  `<img src="${FOTO}" class="foto"><div class="verlauf"></div>
   <div class="badge">${truck(150, F.accent)}</div>`,
  `.foto { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
   .verlauf { position:absolute; inset:0; background:linear-gradient(to top, ${F.espresso} 0%, ${F.espresso}e6 16%, ${F.espresso}00 42%); }
   .badge { position:absolute; left:0; right:0; bottom:72px; display:flex; justify-content:center; }`,
);

/* QR-Code auf den WhatsApp-Chat. Hohe Fehlerkorrektur (H), damit er auch
   gedruckt und teilweise verschmutzt noch gelesen wird. */
const qr = await QR.toBuffer(WA_LINK, {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 1200,
  color: { dark: F.espresso, light: '#FFFFFF' },
});
await sharp(qr).png({ compressionLevel: 9 }).toFile(join(OUT, 'qr-whatsapp.png'));
console.log('   qr-whatsapp.png 1200×1200');

const qrKlein = 'data:image/png;base64,' + qr.toString('base64');

/* Druckkarte 1200×1200 – bei 300 dpi genau 10×10 cm, fuer Aufkleber,
   Flyer oder die Scheibe am Transporter. */
await rendern(
  'qr-karte',
  1200,
  1200,
  `<div class="bg"></div>
   <div class="kopf">
     <span class="sperre">${truck(74, F.accent)}${wortmarke(74, F.espresso)}</span>
   </div>
   <div class="titel">Fragen? Einfach scannen.</div>
   <div class="unter">Angebot per WhatsApp – Fotos genügen</div>
   <div class="qr"><img src="${qrKlein}"></div>
   <div class="fuss">0178 4444 156 &middot; umzuege-bergstrasse.de</div>
   <div class="kante"></div>`,
  `.bg { position:absolute; inset:0; background:${F.tint}; }
   .kopf { position:absolute; left:0; right:0; top:74px; display:flex; justify-content:center; }
   .sperre { display:inline-flex; align-items:center; gap:22px; }
   .titel { position:absolute; left:0; right:0; top:206px; text-align:center;
     font-size:58px; font-weight:800; color:${F.espresso}; letter-spacing:-.02em; }
   .unter { position:absolute; left:0; right:0; top:282px; text-align:center;
     font-size:30px; font-weight:600; color:rgba(42,32,25,.6); }
   .qr { position:absolute; left:0; right:0; top:360px; display:flex; justify-content:center; }
   .qr img { width:560px; height:560px; background:#fff; border-radius:28px; padding:18px; }
   .fuss { position:absolute; left:0; right:0; bottom:78px; text-align:center;
     font-size:34px; font-weight:700; color:${F.espresso}; }
   .kante { position:absolute; left:0; right:0; bottom:0; height:14px; background:${F.accent}; }`,
);

await browser.close();
console.log('fertig');
