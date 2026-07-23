/** Inhalte für die Startseiten-Sektionen (zentral pflegbar). */

export const STATS = [
  { target: 20, format: 'plus', display: '20+', label: 'Jahre Erfahrung' },
  { target: 5000, format: 'thousand', display: '5.000+', label: 'Umzüge' },
  { target: 4.9, format: 'rating', display: '4,9 ★', label: 'Bewertungen' },
  { target: 100, format: 'percent', display: '100 %', label: 'versichert' },
] as const;

export const STEPS = [
  { n: '1', title: 'Anfrage', text: 'Sie schildern uns Ihr Vorhaben – telefonisch oder über das Formular.' },
  { n: '2', title: 'Besichtigung & Festpreis', text: 'Kostenlose Besichtigung vor Ort, danach Ihr verbindliches Festpreisangebot.' },
  { n: '3', title: 'Durchführung', text: 'Unser Team packt an – pünktlich, sorgfältig und zuverlässig.' },
  { n: '4', title: 'Besenreine Übergabe', text: 'Wir übergeben alles sauber und ordentlich – fertig zum Wohlfühlen.' },
];

export const TESTIMONIALS = [
  { quote: 'Vom ersten Anruf bis zur Übergabe alles perfekt organisiert. Das Team war pünktlich, freundlich und unglaublich sorgfältig mit unseren Möbeln.', name: 'Familie Weber', ort: 'Bensheim', initial: 'W' },
  { quote: 'Die Haushaltsauflösung meiner Mutter war eine schwierige Situation – umso dankbarer bin ich für den diskreten und einfühlsamen Umgang.', name: 'Sabine Krämer', ort: 'Heppenheim', initial: 'K' },
  { quote: 'Fairer Festpreis, keine Überraschungen und besenreine Übergabe. Genau so wünscht man sich einen Umzug. Absolute Empfehlung!', name: 'Thomas Adler', ort: 'Weinheim', initial: 'A' },
];

export const FAQS = [
  { q: 'Was kostet ein Umzug oder eine Entrümpelung?', a: 'Der Preis richtet sich nach Umfang, Entfernung und Aufwand. Nach einer kostenlosen Besichtigung erhalten Sie ein verbindliches Festpreisangebot – ohne versteckte Kosten.' },
  { q: 'Wie schnell haben Sie einen Termin frei?', a: 'In der Regel können wir kurzfristig Termine anbieten. Melden Sie sich einfach mit Ihrem Wunschtermin – wir finden gemeinsam die passende Lösung.' },
  { q: 'Ist die Besichtigung wirklich kostenlos?', a: 'Ja. Die Besichtigung vor Ort ist für Sie unverbindlich und kostenfrei – so erhalten Sie ein präzises Angebot ohne jedes Risiko.' },
  { q: 'Entsorgen Sie auch und wird Wertvolles angerechnet?', a: 'Wir entsorgen fachgerecht und umweltbewusst. Verwertbare Gegenstände rechnen wir Ihnen an und reduzieren so Ihre Gesamtkosten.' },
  { q: 'In welchem Umkreis sind Sie tätig?', a: 'Wir sind an der gesamten Bergstraße und im Umland unterwegs – von Weinheim bis Zwingenberg und weit darüber hinaus. Fragen Sie uns gern zu Ihrem Ort.' },
  { q: 'Ist mein Hausrat während des Umzugs versichert?', a: 'Selbstverständlich. Ihr Hausrat ist während des gesamten Umzugs umfassend versichert – für Ihre volle Sicherheit.' },
];

/** Orte im Einsatzgebiet. `slug` verlinkt (falls vorhanden) auf /umzug/<slug>. */
export const AREAS = [
  { name: 'Bensheim', slug: 'bensheim' },
  { name: 'Heppenheim', slug: 'heppenheim' },
  { name: 'Zwingenberg', slug: 'zwingenberg' },
  { name: 'Lorsch', slug: null },
  { name: 'Lampertheim', slug: null },
  { name: 'Bürstadt', slug: null },
  { name: 'Lautertal', slug: null },
  { name: 'Fürth', slug: null },
  { name: 'Rimbach', slug: null },
  { name: 'Birkenau', slug: null },
  { name: 'Hemsbach', slug: null },
  { name: 'Weinheim', slug: 'weinheim' },
  { name: 'Viernheim', slug: null },
  { name: 'Einhausen', slug: null },
];
