/**
 * Versand der Anfrageformulare über FormSubmit.co.
 *
 * Warum eine eigene Datei: Kontakt- und Rückrufformular brauchen exakt
 * dieselbe Logik. Vorher stand sie zweimal da und lief damit auseinander.
 *
 * Wichtig zum Format: Der /ajax/-Endpunkt von FormSubmit erwartet JSON.
 * Ein FormData-Body (multipart/form-data) wird dort abgewiesen – das war
 * der Stand vorher. Dafuer loest application/json einen CORS-Preflight
 * aus; FormSubmit beantwortet den laut Doku korrekt.
 *
 * FormSubmit antwortet auch bei Problemen gelegentlich mit HTTP 200 und
 * success:"false" im Body (z. B. solange die Empfaengeradresse noch nicht
 * bestaetigt ist). Deshalb reicht res.ok als Erfolgspruefung nicht.
 */

export interface SendeErgebnis {
  ok: boolean;
  /** HTTP-Status, 0 bei Netzwerk-/CORS-Fehler */
  status: number;
  /** Antwort im Klartext – landet bei Fehlern in der Konsole */
  text: string;
}

export async function sendeFormular(form: HTMLFormElement, endpoint: string): Promise<SendeErgebnis> {
  // FormData -> einfaches Objekt. Mehrfachfelder werden zusammengefasst,
  // Dateien gibt es in diesen Formularen nicht.
  const daten: Record<string, string> = {};
  new FormData(form).forEach((wert, schluessel) => {
    if (typeof wert !== 'string') return;
    daten[schluessel] = schluessel in daten ? `${daten[schluessel]}, ${wert}` : wert;
  });

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(daten),
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
    // Netzwerkfehler oder von CORS blockiert – hier gibt es keinen Status
    console.error('[Formular] Anfrage kam nicht durch:', fehler);
    return { ok: false, status: 0, text: String(fehler) };
  }
}
