# Umzüge Bergstraße – Website

Homepage für **Umzüge Bergstraße** (Umzüge & Entrümpelung an der Bergstraße / Südhessen).
Gebaut mit **Astro 7** + **Tailwind CSS 4** als statische, extrem schnelle und
SEO-optimierte Website – ausgelegt auf starkes Wachstum (dutzende Leistungs- und
Ortsseiten, mehrstufiges Kontaktformular, programmatic SEO).

## Tech-Stack

- **Astro** (statischer Output, ideal für SEO & Performance)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **@astrojs/sitemap** (automatische `sitemap-index.xml`)
- **Content Collections** für Leistungs- & Ortsseiten
- Framework-freies Vanilla-JS für Interaktionen (Tabs, FAQ, mehrstufiges Formular, Reveal/Parallax)
- **Docker + nginx** für das Deployment (Dokploy-ready)

## Schnellstart

```bash
npm install
npm run dev        # Entwicklung: http://localhost:4321
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
```

## Projektstruktur

```
src/
├── config/site.ts          → ZENTRALE Konfiguration (NAP, Kontakt, Theme, Bewertungen …)
├── data/home.ts            → Inhalte der Startseiten-Sektionen (Stats, Steps, FAQ, Orte …)
├── layouts/BaseLayout.astro→ <head>, SEO-Meta, Open Graph, JSON-LD
├── lib/schema.ts           → JSON-LD Generatoren (LocalBusiness, FAQPage, Service, Breadcrumb)
├── components/             → Nav, Hero, Stats, About, Services, Process, Benefits,
│                             ServiceArea, Testimonials, Contact (Formular), Faq, Footer, MobileCta
├── content/
│   ├── services/*.md       → eine Datei = eine Leistungsseite  (/leistungen/<slug>)
│   └── locations/*.md      → eine Datei = eine Ortsseite        (/umzug/<slug>)
├── content.config.ts       → Schema der Content Collections
├── pages/
│   ├── index.astro         → Startseite
│   ├── leistungen/[...slug].astro → generiert alle Leistungsseiten
│   ├── umzug/[...slug].astro      → generiert alle Ortsseiten
│   ├── impressum.astro / datenschutz.astro / 404.astro
├── scripts/ui.ts           → globale UI-Interaktionen
└── styles/global.css       → Tailwind + Farbwelten + Komponenten-Klassen
```

## Farbwelt (Theme) umstellen

Zentral in `src/config/site.ts` → `theme`:

| Farbwelt              | Wert            |
|-----------------------|-----------------|
| Orange (warm)         | `''`            |
| Knallgrün (Standard)  | `'theme-green'` |
| Tannengrün & Gelb     | `'theme-pine'`  |

Die Farbwelt ist als CSS-Variablen-System umgesetzt (`--accent`, `--espresso`, …) und
wirkt automatisch auf alle Tailwind-Utilities (`bg-accent`, `text-ink`, `bg-espresso` …).

## Neue Seiten anlegen (programmatic SEO)

**Neue Leistung:** eine Markdown-Datei in `src/content/services/` anlegen –
z. B. `klaviertransport.md`. Sie wird automatisch unter `/leistungen/klaviertransport`
gebaut, in Sitemap, interne Verlinkung und JSON-LD aufgenommen.

**Neuen Ort:** eine Markdown-Datei in `src/content/locations/` anlegen –
z. B. `lorsch.md`. Ergibt automatisch `/umzug/lorsch`. Damit der Ort auch in der
Chip-Liste auf der Startseite verlinkt wird, in `src/data/home.ts` beim passenden
Eintrag `slug` setzen.

Die Frontmatter-Felder (Pflicht/optional) sind in `src/content.config.ts` definiert.

## Mehrstufiges Kontaktformular

`src/components/Contact.astro` enthält ein **Typeform-artiges, mehrstufiges Formular**
(Fortschrittsbalken, Auswahl-Karten mit Auto-Weiter, Validierung pro Schritt, Enter =
weiter). Es funktioniert auch ohne JavaScript (dann als normales Formular).

**Versand anbinden:** Aktuell zeigt das Formular nur die Erfolgsmeldung. Für echten
Versand die mit `TODO` markierte Stelle im `<script>` von `Contact.astro` aktivieren
und einen Endpunkt hinterlegen (z. B. eigenes PHP/Node-Skript, Formspree, Brevo o. Ä.):

```js
const data = new FormData(form);
await fetch('<ENDPUNKT>', { method: 'POST', body: data });
```

## Vor dem Livegang ausfüllen (Platzhalter)

Alle geschäftlichen Daten zentral in **`src/config/site.ts`** (mit `[TODO]` markiert):

- **Domain** (`url`) – zusätzlich in `astro.config.mjs` bzw. Umgebungsvariable `SITE_URL`
- **Kontakt**: Telefon (`phone` + `phoneHref`), E-Mail
- **Adresse** + optional **Geo-Koordinaten** (für lokale SEO)
- **Öffnungszeiten** (Anzeige + `openingHoursSpec` für JSON-LD)
- **Bewertungen** (echte Anzahl)
- **Social-Links** (Instagram/Facebook)
- **Impressum**: Inhaber, ggf. USt-IdNr.

Weitere To-dos:

- **Fotos** ersetzen die gestreiften Platzhalter (`.photo-ph` / `photoLabel`).
- **Karte** im Kontaktbereich (`.map-ph`) durch echte Einbettung ersetzen.
- **Rechtstexte** (Impressum/Datenschutz) durch geprüfte Fassungen ersetzen.
- **OG-Bild**: `public/og-default.svg` ggf. durch ein 1200×630-PNG/JPG ersetzen.

## SEO-Features (bereits eingebaut)

- Saubere Meta-Tags, Canonicals (trailing-slash-konsistent), Open Graph & Twitter Cards
- JSON-LD: `MovingCompany`/`LocalBusiness`, `WebSite`, `FAQPage`, `Service`, `BreadcrumbList`
- Automatische `sitemap-index.xml` (Rechtsseiten ausgeschlossen), `robots.txt`
- Semantisches HTML, `lang="de"`, Breadcrumbs, interne Verlinkung Leistungen ↔ Orte
- Skalierbare Struktur für programmatic SEO
- Respektiert `prefers-reduced-motion`, gute Core-Web-Vitals durch statischen Output

## Deployment

Siehe **[DEPLOY.md](./DEPLOY.md)** für die Schritt-für-Schritt-Anleitung mit **Dokploy**
(Docker/nginx). Kurz: Repo in Dokploy als Application anlegen, Build-Type „Dockerfile“,
Port `80`, Env `SITE_URL=https://ihre-domain.de` setzen, Domain zuweisen.
