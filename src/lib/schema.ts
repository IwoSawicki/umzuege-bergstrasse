/**
 * JSON-LD Structured Data (schema.org) – zentral generiert aus der
 * Site-Konfiguration. Wird im <head> als <script type="application/ld+json">
 * ausgegeben und ist eine wichtige Grundlage für lokale SEO / Rich Results.
 */
import { SITE, absUrl, isFilled } from '../config/site';

const ORG_ID = absUrl('/#business');

/** LocalBusiness / MovingCompany – Kern der lokalen Sichtbarkeit. */
export function localBusiness(extra: Record<string, unknown> = {}) {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    '@id': ORG_ID,
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    areaServed: { '@type': 'AdministrativeArea', name: 'Bergstraße, Südhessen' },
    ...extra,
  };

  if (isFilled(SITE.contact.phone)) node.telephone = SITE.contact.phone;
  if (isFilled(SITE.contact.email)) node.email = SITE.contact.email;

  const addr: Record<string, string> = { '@type': 'PostalAddress', addressCountry: SITE.address.country };
  if (isFilled(SITE.address.street)) addr.streetAddress = SITE.address.street;
  if (isFilled(SITE.address.postalCode)) addr.postalCode = SITE.address.postalCode;
  if (isFilled(SITE.address.city)) addr.addressLocality = SITE.address.city;
  if (SITE.address.region) addr.addressRegion = SITE.address.region;
  node.address = addr;

  if (SITE.geo?.latitude && SITE.geo?.longitude) {
    node.geo = { '@type': 'GeoCoordinates', latitude: SITE.geo.latitude, longitude: SITE.geo.longitude };
  }

  if (SITE.openingHoursSpec?.length) {
    node.openingHoursSpecification = SITE.openingHoursSpec.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: s.days,
      opens: s.opens,
      closes: s.closes,
    }));
  }

  const sameAs = [SITE.social.instagram, SITE.social.facebook].filter(Boolean);
  if (sameAs.length) node.sameAs = sameAs;

  if (SITE.rating?.count) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: SITE.rating.value,
      reviewCount: SITE.rating.count,
    };
  }

  return node;
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absUrl('/#website'),
    url: SITE.url,
    name: SITE.name,
    inLanguage: 'de-DE',
    publisher: { '@id': ORG_ID },
  };
}

export function faqPage(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function service(opts: { name: string; description: string; path: string; areaServed?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: opts.name,
    name: opts.name,
    description: opts.description,
    url: absUrl(opts.path),
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'AdministrativeArea', name: opts.areaServed || 'Bergstraße, Südhessen' },
  };
}
