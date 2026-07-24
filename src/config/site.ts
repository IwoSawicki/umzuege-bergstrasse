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
  legalName: 'Umzüge Bergstraße', // [TODO] vollständige Firmierung inkl. Rechtsform
  shortName: 'UB',

  tagline: 'Umzüge & Entrümpelung an der Bergstraße',
  description:
    'Persönlich, zuverlässig und aus einer Hand – vom sorgfältigen Privatumzug bis zur diskreten Haushaltsauflösung an der Bergstraße. Kostenlose Besichtigung & Festpreisgarantie.',

  /** Farbwelt: '' (Orange) | 'theme-green' (Knallgrün) | 'theme-pine' (Tannengrün & Gelb) */
  theme: 'theme-green',
  themeColor: '#101418',

  contact: {
    phone: '0178 4444 156',
    phoneHref: '+491784444156',
    email: 'kontakt@umzuege-bergstrasse.de',
    whatsapp: '', // optional
  },

  /** Adresse wird auf der Seite NICHT angezeigt (showAddress:false). Ort/Region
      bleiben nur in den Structured Data für lokale Sichtbarkeit. */
  showAddress: false,
  address: {
    street: '[STRASSE HAUSNR.]', // wird nicht angezeigt
    postalCode: '[PLZ]', // wird nicht angezeigt
    city: 'Bensheim', // Ort (nur für JSON-LD / lokale SEO)
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

  rating: {
    value: '4.9',
    count: 127, // [TODO] echte Anzahl Bewertungen
  },

  social: {
    instagram: '', // [TODO] volle URL
    facebook: '', // [TODO] volle URL
  },

  /** Wird für Impressum benötigt */
  legal: {
    owner: '[INHABER / GESCHÄFTSFÜHRER]', // [TODO]
    vatId: '', // USt-IdNr., optional
  },
} as const;

export const NAV = [
  { href: '/#warum', label: 'Über uns' },
  { href: '/#leistungen', label: 'Leistungen' },
  { href: '/#stimmen', label: 'Kundenstimmen' },
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
