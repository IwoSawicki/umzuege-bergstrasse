/**
 * Conversion-Ereignisse für Google Analytics 4 und Google Ads.
 *
 * gtag existiert erst, nachdem der Besucher im Consent-Banner zugestimmt
 * hat – vorher wird bewusst nichts gesendet. Ohne Einwilligung gibt es
 * also keine Messung, und das ist so gewollt.
 *
 * In GA4 unter "Ereignisse" als Schlüsselereignis markieren, dann in
 * Google Ads unter Tools → Conversions aus GA4 importieren.
 */
type Gtag = (command: string, ...args: unknown[]) => void;

export function track(event: string, params: Record<string, unknown> = {}) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', event, params);
}

/** Anfrage abgeschickt – die eigentliche Conversion. */
export function trackLead(quelle: string) {
  track('generate_lead', { form_location: quelle });
}

/** Klick auf eine Telefonnummer – zweitwichtigste Conversion. */
export function trackCall(ort: string) {
  track('contact', { method: 'phone', link_location: ort });
}
