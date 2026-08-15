/**
 * Zentrale Konfiguration – "Single Source of Truth".
 *
 * Diese Werte werden überall verwendet: Meta-Tags, JSON-LD (LocalBusiness),
 * Kontaktbereich, Footer, mobile CTA. Für konsistente lokale SEO (NAP =
 * Name, Address, Phone identisch auf allen Seiten) bitte NUR hier pflegen.
 *
 * TODO vor dem Livegang: alle mit [TODO] markierten Felder ausfüllen.
 */

export const SITE = {
  /** Produktions-Domain (ohne abschließenden Slash). Auch in astro.config.mjs / SITE_URL setzen. */
  url: 'https://umzuege-bergstrasse.de',

  name: 'Umzüge Bergstraße',
  legalName: 'Umzüge Bergstraße', // Marken-/Anzeigename
  shortName: 'UB',

  tagline: 'Umzüge & Entrümpelung an der Bergstraße',
  description:
    'Persönlich, zuverlässig und aus einer Hand – vom sorgfältigen Privatumzug bis zur diskreten Haushaltsauflösung an der Bergstraße. Kostenlose Besichtigung & Festpreisgarantie.',

  /** Farbwelt: '' (Orange) | 'theme-green' (Knallgrün) | 'theme-pine' (Tannengrün & Gelb) */
  theme: '',
  themeColor: '#2A2019',

  contact: {
    phone: '0178 4444 156',
    phoneHref: '+491784444156',
    email: 'kontakt@umzuege-bergstrasse.de',
    whatsapp: '', // optional
  },

  /** Zieladresse für Formular-Anfragen (FormSubmit.co-Endpunkt).
      Erste Anfrage löst eine Aktivierungs-Mail aus – einmal bestätigen! */
  leadEmail: 'iwo@stolz-marketing.de',

  /** Google-IDs – eintragen, sobald vorhanden. Solange leer, lädt nichts. */
  analytics: {
    gaId: 'G-6YQ8075QM0', // Google Analytics 4
    adsId: '', // z. B. 'AW-XXXXXXXXX' (Google Ads Conversion)
  },

  /** Adresse wird auf der Seite NICHT angezeigt (showAddress:false) – nur im
      Impressum (gesetzlich Pflicht). Ort/Region bleiben in den Structured Data. */
  showAddress: false,
  address: {
    street: 'Heidelbergerstraße 15D',
    postalCode: '64385',
    city: 'Reichelsheim',
    region: 'Hessen',
    country: 'DE',
  },

  /** Kein Ladenlokal → keine Geo-Koordinaten (Adresse soll nicht sichtbar sein). */
  geo: null as { latitude: number; longitude: number } | null,

  openingHours: 'Montag bis Samstag, 8–20 Uhr',
  /** Strukturierte Öffnungszeiten für JSON-LD */
  openingHoursSpec: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '08:00', closes: '20:00' },
  ] as { days: string[]; opens: string; closes: string }[],

  /** Sterne-Schnitt für die Structured Data (AggregateRating).
      WICHTIG: count MUSS die tatsächliche Anzahl echter Bewertungen sein.
      Solange 0, wird kein aggregateRating ausgegeben – erfundene Werte sind
      ein Verstoß gegen Googles Richtlinien für strukturierte Daten und
      nach UWG abmahnfähig. Erst befüllen, wenn die Bewertungen wirklich
      öffentlich sichtbar sind (z. B. im Google-Unternehmensprofil). */
  rating: {
    value: '',
    count: 0,
  },

  social: {
    instagram: '', // [TODO] volle URL
    facebook: '', // [TODO] volle URL
  },

  /** Wird für Impressum & Datenschutz benötigt */
  legal: {
    /** Rechtsträger, unter dem die Marke läuft */
    brandOf: 'Stolz Marketing, Inh. Iwo Sawicki',
    owner: 'Iwo Sawicki',
    vatId: 'DE350093785',
    /** Hosting-Anbieter für die Datenschutzerklärung – [TODO] eintragen */
    host: '[HOSTING-ANBIETER, z. B. Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen]',
  },
} as const;

export const NAV = [
  { href: '/#warum', label: 'Über uns' },
  { href: '/#leistungen', label: 'Leistungen' },
  { href: '/#versprechen', label: 'Versprechen' },
  { href: '/#kontakt', label: 'Kontakt' },
];

/** Hilfsfunktion: absolute URL für Canonicals/OG bauen */
export function absUrl(path = '/'): string {
  return new URL(path, SITE.url).href;
}

/**
 * Canonical-URL bauen – mit abschließendem Slash (konsistent zur Sitemap,
 * die Astro im 'directory'-Format erzeugt). Dateien (mit Punkt) und der
 * Root bleiben unverändert.
 */
export function canonicalUrl(path = '/'): string {
  let p = path.split('#')[0].split('?')[0];
  if (p !== '/' && !p.includes('.') && !p.endsWith('/')) p += '/';
  return new URL(p, SITE.url).href;
}

/** Ist ein Kontaktwert schon echt gepflegt (kein Platzhalter)? */
export function isFilled(value: string | undefined | null): boolean {
  return !!value && !value.includes('[');
}
