/** Inhalte für die Startseiten-Sektionen (zentral pflegbar). */

// Ehrliche Leistungsversprechen statt erfundener Track-Record-Zahlen.
export const STATS = [
  { display: '0 €', label: 'Kostenlose Besichtigung' },
  { display: '100 %', label: 'Festpreis-Garantie' },
  { display: '24 Std.', label: 'Schnelle Rückmeldung' },
  { display: '7 Tage', label: 'Flexible Termine' },
] as const;

export const STEPS = [
  { n: '1', title: 'Anfrage', text: 'Sie schildern uns Ihr Vorhaben – telefonisch oder über das Formular.' },
  { n: '2', title: 'Besichtigung & Festpreis', text: 'Kostenlose Besichtigung vor Ort, danach Ihr verbindliches Festpreisangebot.' },
  { n: '3', title: 'Durchführung', text: 'Unser Team packt an – pünktlich, sorgfältig und zuverlässig.' },
  { n: '4', title: 'Besenreine Übergabe', text: 'Wir übergeben alles sauber und ordentlich – fertig zum Wohlfühlen.' },
];

// ECHTE Kundenstimmen hier eintragen, sobald vorhanden – dann in index.astro
// die <Versprechen />-Sektion wieder durch <Testimonials /> ersetzen.
// Format: { quote, name, ort, initial }
export const TESTIMONIALS: { quote: string; name: string; ort: string; initial: string }[] = [];

export const FAQS = [
  { q: 'Was kostet ein Umzug oder eine Entrümpelung?', a: 'Der Preis richtet sich nach Umfang, Entfernung und Aufwand. Nach einer kostenlosen Besichtigung erhalten Sie ein verbindliches Festpreisangebot – ohne versteckte Kosten.' },
  { q: 'Wie schnell haben Sie einen Termin frei?', a: 'In der Regel können wir kurzfristig Termine anbieten. Melden Sie sich einfach mit Ihrem Wunschtermin – wir finden gemeinsam die passende Lösung.' },
  { q: 'Ist die Besichtigung wirklich kostenlos?', a: 'Ja. Die Besichtigung vor Ort ist für Sie unverbindlich und kostenfrei – so erhalten Sie ein präzises Angebot ohne jedes Risiko.' },
  { q: 'Entsorgen Sie auch und wird Wertvolles angerechnet?', a: 'Wir entsorgen fachgerecht und umweltbewusst. Verwertbare Gegenstände rechnen wir Ihnen an und reduzieren so Ihre Gesamtkosten.' },
  { q: 'In welchem Umkreis sind Sie tätig?', a: 'Wir sind an der gesamten Bergstraße und im Umland unterwegs – von Weinheim bis Zwingenberg und weit darüber hinaus. Fragen Sie uns gern zu Ihrem Ort.' },
  { q: 'Stellen Sie Umzugskartons und Verpackungsmaterial?', a: 'Auf Wunsch bringen wir Umzugskartons, Packmaterial und Möbeldecken mit und nehmen die Kartons nach dem Umzug wieder mit. Sprechen Sie uns einfach darauf an.' },
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
  { name: 'Rimbach', slug: 'rimbach' },
  { name: 'Lindenfels', slug: 'lindenfels' },
  { name: 'Reichelsheim', slug: 'reichelsheim' },
  { name: 'Wald-Michelbach', slug: 'wald-michelbach' },
  { name: 'Birkenau', slug: null },
  { name: 'Hemsbach', slug: null },
  { name: 'Weinheim', slug: 'weinheim' },
  { name: 'Viernheim', slug: null },
  { name: 'Einhausen', slug: null },
];
