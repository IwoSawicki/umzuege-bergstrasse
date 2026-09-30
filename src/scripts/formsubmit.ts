/**
 * Versand der Anfrageformulare an den eigenen Mail-Endpunkt.
 *
 * Vorher lief das über FormSubmit.co. Der Dienst hat den Rückruf wiederholt
 * abgewiesen – zuletzt sichtbar als CORS-Fehler, weil seine Fehlerantworten
 * keine Access-Control-Header tragen und der Browser deshalb den eigentlichen
 * HTTP 500 gar nicht mehr zeigt. Die Ursache liess sich von aussen nicht
 * feststellen, also läuft der Versand jetzt über /api/anfrage auf dem eigenen
 * Server (siehe server/mail.mjs).
 *
 * Gleiche Domain wie die Seite: kein CORS, kein Preflight, kein Drittanbieter,
 * keine Freischaltung und keine fremde Spam-Heuristik, die uns aussperrt.
 */

export interface SendeErgebnis {
  ok: boolean;
  /** HTTP-Status, 0 bei Netzwerkfehler oder Zeitüberschreitung */
  status: number;
  /** Fehlertext für die Konsole – im Erfolgsfall leer */
  text: string;
}

/** Nach so vielen Millisekunden wird abgebrochen. Ein hängender Request ist
    für den Besucher schlimmer als eine Fehlermeldung: Der Knopf bleibt auf
    "Wird gesendet", und er weiss nicht, ob die Anfrage raus ist. */
const ZEITLIMIT_MS = 15000;

export async function sendeFormular(form: HTMLFormElement, endpoint: string): Promise<SendeErgebnis> {
  const abbruch = new AbortController();
  const uhr = setTimeout(() => abbruch.abort(), ZEITLIMIT_MS);

  const daten: Record<string, string> = {};
  new FormData(form).forEach((wert, schluessel) => {
    if (typeof wert !== 'string') return;
    daten[schluessel] = schluessel in daten ? `${daten[schluessel]}, ${wert}` : wert;
  });
  // Damit in der Mail steht, welche Seite den Lead gebracht hat
  daten.quelle = location.pathname;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daten),
      signal: abbruch.signal,
    });
    const text = await res.text();

    let erfolg = res.ok;
    let meldung = text;
    try {
      const json = JSON.parse(text) as { ok?: boolean; fehler?: string };
      if (typeof json.ok === 'boolean') erfolg = json.ok;
      if (json.fehler) meldung = json.fehler;
    } catch {
      /* keine JSON-Antwort – dann zählt allein der HTTP-Status */
    }

    if (!erfolg) console.error('[Formular] Versand fehlgeschlagen. HTTP', res.status, '–', meldung);
    return { ok: erfolg, status: res.status, text: erfolg ? '' : meldung };
  } catch (fehler) {
    const abgebrochen = fehler instanceof DOMException && fehler.name === 'AbortError';
    console.error(
      abgebrochen
        ? `[Formular] Keine Antwort innerhalb von ${ZEITLIMIT_MS / 1000} Sekunden – abgebrochen.`
        : '[Formular] Anfrage kam nicht durch:',
      abgebrochen ? '' : fehler,
    );
    return { ok: false, status: 0, text: abgebrochen ? 'Zeitüberschreitung' : String(fehler) };
  } finally {
    clearTimeout(uhr);
  }
}
