# Umzüge Bergstraße – Homepage

Statische Homepage für **Umzüge Bergstraße** (Umzüge & Entrümpelung an der Bergstraße/Südhessen).
Umgesetzt als schlanke, selbsttragende Website ohne Framework – reines HTML, CSS und Vanilla-JavaScript.

Die Seite wurde aus einem Claude-Design-Component-Export (`.dc.html`) in eine echte,
deploybare Website überführt. Die proprietäre Template-Logik (`{{ }}`, `sc-for`, `sc-if`,
`DCLogic`, `support.js`) wurde vollständig durch semantisches HTML und klassisches
JavaScript ersetzt.

## Struktur

```
index.html        – komplette Seite (semantisches HTML)
css/styles.css    – Styles inkl. Farbwelten (Themes) und Responsive-Layout
js/main.js        – Interaktion: Menü, Tabs, FAQ, Formular, Scroll-Reveal, Parallax, Zähler
assets/           – Platz für echte Fotos, Logo, Karte etc.
```

## Lokal ansehen

Einfach `index.html` im Browser öffnen – oder ein kleiner lokaler Server:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 aufrufen
```

## Farbwelt (Theme) umstellen

Die Farbwelt wird über eine Klasse am `<body>` gesteuert (Standard: **Knallgrün**):

| Farbwelt              | `class` am `<body>` |
|-----------------------|---------------------|
| Orange (warm)         | *(keine Klasse)*    |
| Knallgrün (Standard)  | `theme-green`       |
| Tannengrün & Gelb     | `theme-pine`        |

Beispiel: `<body class="theme-pine">`

## Noch zu ergänzen (Platzhalter)

Vor dem Live-Gang bitte die Platzhalter befüllen:

- **Kontaktdaten** – überall dort, wo `[TELEFONNUMMER]`, `[E-MAIL]`, `[ADRESSE]` und
  `[ÖFFNUNGSZEITEN]` steht (`data-contact`-Felder in `index.html`).
  Sobald eine echte Telefonnummer eingetragen ist, verlinkt `js/main.js` den
  „Anrufen“-Button in der mobilen Leiste automatisch als `tel:`-Link.
- **Fotos** – die gestreiften Platzhalterflächen (Hero, „Warum wir“, Leistungen,
  Kontakt-Karte) durch echte Bilder ersetzen.
- **Karte** – der Platzhalter „Karte: Bergstraße / Bensheim“ kann durch eine
  eingebettete Karte (z. B. OpenStreetMap/Google Maps) ersetzt werden.
- **Social-Links** – die `#`-Links (Instagram/Facebook) im Footer.
- **Formularversand** – das Kontaktformular zeigt aktuell nur eine Erfolgsmeldung
  an. Für echten Versand einen Endpunkt anbinden (eigenes Skript, Formspree,
  Mail-Service o. Ä.) – siehe Kommentar in `js/main.js` (`data-contact-form`).
- **Rechtstexte** – `Impressum` und `Datenschutzerklärung` verlinken bislang auf
  Anker (`#impressum`, `#datenschutz`); bitte durch echte Seiten/Inhalte ersetzen.

## Barrierefreiheit & Performance

- Respektiert `prefers-reduced-motion` (Animationen/Parallax werden reduziert).
- Inhalte sind auch ohne JavaScript vollständig sichtbar (Progressive Enhancement).
- Tabs, FAQ und Menü nutzen `aria`-Attribute.
- Keine externen Abhängigkeiten außer der Google-Font „Hanken Grotesk“.
