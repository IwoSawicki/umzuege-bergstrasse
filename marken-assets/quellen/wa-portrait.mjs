/**
 * Profilbild aus dem hochaufloesenden Original.
 *
 * WhatsApp beschneidet das Profilbild kreisrund und zeigt es in Chatlisten
 * mit rund 50 Pixel Kantenlaenge. Der Kopf muss deshalb gross im Bild stehen –
 * ein Halbkoerperbild wird bei der Groesse zu einem unkenntlichen Fleck.
 * Faustregel: Kopfhoehe rund 58% der Bildhoehe, Augen auf 40% von oben.
 */
import sharp from '../../node_modules/sharp/dist/index.cjs';
import { join } from 'node:path';

import { fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../..', import.meta.url));
const OUT = process.env.OUT || join(REPO, 'marken-assets/whatsapp');
const QUELLE = join(REPO, 'src/assets/Iwo-StolzMarketing.jpg');

/* Im 600x900-Vorschaubild abgelesen, mal 7.787 (4672/600) gerechnet: */
const gesicht = { x: 2297, augenY: 1752, kopfOben: 973, kinn: 2492 };
const kopfHoehe = gesicht.kinn - gesicht.kopfOben; // 1519
const seite = Math.round(kopfHoehe / 0.58); // Kopf = 58% der Kante
const links = Math.round(gesicht.x - seite / 2);
const oben = Math.round(gesicht.augenY - seite * 0.4); // Augen auf 40%

console.log('Ausschnitt', { seite, links, oben, rechts: links + seite, unten: oben + seite });

const ZIEL = 1080;

await sharp(QUELLE)
  .extract({ left: links, top: oben, width: seite, height: seite })
  .resize(ZIEL, ZIEL, { kernel: 'lanczos3' })
  .modulate({ saturation: 1.04 })
  .sharpen({ sigma: 0.7 })
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
  .toFile(join(OUT, 'profilbild-iwo.jpg'));
console.log('   profilbild-iwo.jpg', `${ZIEL}×${ZIEL}`);

/* Vorschau auf Wunsch: VORSCHAU=1 legt den runden Ausschnitt einmal gross und
   einmal in Chatlisten-Groesse daneben ab. Nur die kleine Fassung entscheidet,
   ob ein Profilbild funktioniert. */
if (process.env.VORSCHAU) {
  for (const [name, g] of [['gross', 420], ['klein', 56]]) {
    const maske = await sharp(
      Buffer.from(`<svg width="${g}" height="${g}"><circle cx="${g / 2}" cy="${g / 2}" r="${g / 2}" fill="#fff"/></svg>`),
    )
      .resize(g, g)
      .png()
      .toBuffer();
    await sharp(join(OUT, 'profilbild-iwo.jpg'))
      .resize(g, g)
      .composite([{ input: maske, blend: 'dest-in' }])
      .png()
      .toFile(join(OUT, `vorschau-kreis-${name}.png`));
  }
  console.log('   Vorschauen geschrieben');
}
