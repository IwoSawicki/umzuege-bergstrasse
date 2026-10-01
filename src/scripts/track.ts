/**
 * Conversion-Ereignisse für Google Analytics 4, Google Ads und Umami.
 *
 * gtag existiert erst, nachdem der Besucher im Consent-Banner zugestimmt
 * hat – vorher wird bewusst nichts an Google gesendet. Ohne Einwilligung
 * gibt es also keine Google-Messung, und das ist so gewollt.
 *
 * Umami läuft parallel und ohne Einwilligung (cookielos, eigene Server,
 * siehe site.ts). Dadurch sind die Conversions auch für die Mehrheit
 * sichtbar, die den Banner ablehnt – in Google fehlen die komplett.
 *
 * In GA4 unter "Ereignisse" als Schlüsselereignis markieren, dann in
 * Google Ads unter Tools → Conversions aus GA4 importieren.
 */
type Gtag = (command: string, ...args: unknown[]) => void;
type Umami = { track: (name: string, daten?: Record<string, unknown>) => void };

export function track(event: string, params: Record<string, unknown> = {}) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', event, params);
}

/** Dasselbe Ereignis zusätzlich an Umami. Fehlt Umami, passiert nichts. */
export function trackUmami(name: string, daten?: Record<string, unknown>) {
  const umami = (window as unknown as { umami?: Umami }).umami;
  if (!umami || typeof umami.track !== 'function') return;
  try {
    umami.track(name, daten);
  } catch {
    /* Messung darf die Seite nie stoeren */
  }
}

/** Anfrage abgeschickt – die eigentliche Conversion. */
export function trackLead(quelle: string) {
  track('generate_lead', { form_location: quelle });
  trackUmami('anfrage-abgeschickt', { quelle });
}

/** Klick auf eine Telefonnummer – zweitwichtigste Conversion. */
export function trackCall(ort: string) {
  track('contact', { method: 'phone', link_location: ort });
  trackUmami('anruf-klick', { ort });
}

/** Klick auf einen WhatsApp-Link. Auf dieser Seite der Haupt-Kontaktweg. */
export function trackWhatsapp(ort: string) {
  track('contact', { method: 'whatsapp', link_location: ort });
  trackUmami('whatsapp-klick', { ort });
}

/* ---- Google Ads -------------------------------------------------------
   trackConv und die Labels setzt das Inline-Script im ConsentBanner.
   Von dort holen wir sie, weil dieses Modul gebuendelt wird und deshalb
   kein define:vars bekommen kann. Fehlt eins von beidem, passiert nichts. */
type ConvFn = (label: string, value?: number) => void;

export function trackAdsConversion(art: 'formular' | 'anruf' | 'whatsapp', wert?: number) {
  const w = window as unknown as { trackConv?: ConvFn; __ubAdsLabels?: Record<string, string> };
  const label = w.__ubAdsLabels?.[art];
  if (typeof w.trackConv !== 'function' || !label) return;
  w.trackConv(label, wert);
}
