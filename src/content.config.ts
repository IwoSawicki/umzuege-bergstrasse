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
    photoLabel: z.string().default('Foto: Leistung'),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    draft: z.boolean().default(false),
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
    photoLabel: z.string().default('Foto: Umzug vor Ort'),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, locations };
