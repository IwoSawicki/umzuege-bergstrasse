/**
 * Versand der Anfrageformulare über FormSubmit.co.
 *
 * Warum eine eigene Datei: Kontakt- und Rückrufformular brauchen exakt
 * dieselbe Logik. Vorher stand sie zweimal da und lief auseinander.
 *
 * Format: FormData (multipart/form-data). Das lief nachweislich, solange
 * die Empfaengeradresse bei FormSubmit bestaetigt war. JSON waere laut
 * Doku ebenfalls moeglich, loest aber einen CORS-Preflight aus – gegen
 * einen Dienst, den wir nicht testen koennen, bleiben wir beim Bewaehrten.
 *
 * Zwei Faellen, die frueher als Erfolg durchgingen:
 *
 * 1. FormSubmit antwortet mit HTTP 200 und success:"false", solange die
 *    Empfaengeradresse nicht bestaetigt ist. res.ok allein genuegt also
 *    nicht – sonst sieht der Besucher "Danke", die Ads-Conversion feuert,
 *    und die Anfrage kommt nirgends an.
 *
 * 2. Ohne Protokollierung liess sich von aussen nicht unterscheiden, ob
 *    die Adresse unbestaetigt ist, der Request abgewiesen wurde oder das
 *    Netz schuld war. Jede Fehlermeldung landet deshalb als "[Formular]"
 *    in der Browser-Konsole.
 */

export interface SendeErgebnis {
  ok: boolean;
  /** HTTP-Status, 0 bei Netzwerk-/CORS-Fehler */
  status: number;
  /** Antwort im Klartext – landet bei Fehlern in der Konsole */
  text: string;
}

/** Nach so vielen Millisekunden wird abgebrochen. Ein haengender Request
    ist fuer den Besucher schlimmer als eine Fehlermeldung: Der Knopf bleibt
    auf "Wird gesendet", und er weiss nicht, ob die Anfrage raus ist. */
const ZEITLIMIT_MS = 15000;

export async function sendeFormular(form: HTMLFormElement, endpoint: string): Promise<SendeErgebnis> {
  const abbruch = new AbortController();
  const uhr = setTimeout(() => abbruch.abort(), ZEITLIMIT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
      signal: abbruch.signal,
    });
    const text = await res.text();

    let erfolg = res.ok;
    try {
      const json = JSON.parse(text) as { success?: boolean | string };
      // FormSubmit liefert success mal als Boolean, mal als String
      if (json && 'success' in json) erfolg = json.success === true || json.success === 'true';
    } catch {
      /* kein JSON – dann zaehlt allein der HTTP-Status */
    }

    if (!erfolg) {
      console.error('[Formular] Versand fehlgeschlagen. HTTP', res.status, '–', text);
    }
    return { ok: erfolg, status: res.status, text };
  } catch (fehler) {
    // Zeitueberschreitung, Netzwerkfehler oder von CORS blockiert
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
