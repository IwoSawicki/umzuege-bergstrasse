import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content Collections – die Basis für programmatische SEO.
 * Jede .md-Datei erzeugt eine eigene, vollständig gerenderte Seite:
 *   src/content/services/<slug>.md   →  /leistungen/<slug>
 *   src/content/locations/<slug>.md  →  /umzug/<slug>
 *
 * Neue Leistung/Ort = einfach neue Markdown-Datei anlegen. Fertig.
 */

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(), // H1
    tab: z.string().optional(), // Kurzlabel
    order: z.number().default(99),
    metaTitle: z.string().optional(),
    metaDescription: z.string(),
    excerpt: z.string(),
    /** Checkliste, die auf der Seite statt eines Fotos steht */
    includes: z.array(z.string()).default([]),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    draft: z.boolean().default(false),

    /* ---- Landingpage-Felder (optional) ----------------------------------
       Sind sie gesetzt, rendert die Leistungsseite im Startseiten-Layout mit
       Bild, Kacheln und beiden Formularen. Fehlen sie, bleibt die Seite
       schlank – so muessen nicht alle Leistungen gleich ausgebaut sein. */

    /** H1 der Landingpage. Der Teil in `headlineAccent` wird orange gesetzt. */
    headline: z.string().optional(),
    headlineAccent: z.string().optional(),
    /** Fliesstext unter der H1 – der wichtigste Satz der Seite. */
    heroText: z.string().optional(),
    /** Wert, den das Kontaktformular vorausgewaehlt mitschickt. Dadurch
        entfaellt der Schritt "Worum geht es?" – eine Frage weniger. */
    formLeistung: z.enum(['Umzug', 'Entrümpelung', 'Beides']).optional(),

    /** Ueberschrift der orangenen Vorteils-Kachel. */
    vorteileTitel: z.string().optional(),
    /** Typische Faelle – die braunen Kacheln. */
    faelle: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
    /** Ablauf in Schritten – ersetzt den generischen Prozess der Startseite. */
    ablauf: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
    /** Was den Preis bestimmt. Bewusst ohne Betraege: der Festpreis entsteht
        erst bei der Besichtigung, erfundene "ab"-Preise wuerden ihm widersprechen. */
    preisfaktoren: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
  }),
});

const locations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/locations' }),
  schema: z.object({
    name: z.string(), // Ortsname, z. B. "Bensheim"
    order: z.number().default(99),
    metaTitle: z.string().optional(),
    metaDescription: z.string(),
    intro: z.string(),
    postalCodes: z.array(z.string()).optional(),
    neighbours: z.array(z.string()).optional(), // Nachbarorte für interne Verlinkung

    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, locations };
