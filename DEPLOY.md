# Deployment mit Dokploy

Die Website wird als **statischer Build** erzeugt und über **nginx** ausgeliefert.
Daneben läuft im selben Container ein kleiner **Node-Dienst für die
Anfrageformulare** (`server/mail.mjs`), den nginx unter `/api/` weiterreicht.
Dokploy baut das mitgelieferte `Dockerfile` und startet den Container.

> Warum ein eigener Dienst: Vorher lief der Formularversand über FormSubmit.co.
> Der Dienst hat Anfragen wiederholt mit HTTP 500 abgewiesen – sichtbar als
> CORS-Fehler, weil seine Fehlerantworten keine `Access-Control-Allow-Origin`-
> Header tragen. Da Formulare auf derselben Domain laufen, gibt es jetzt weder
> CORS noch einen Drittanbieter, der den Versand blockieren kann.

## Enthaltene Dateien

| Datei          | Zweck                                                        |
|----------------|-------------------------------------------------------------|
| `Dockerfile`   | Multi-Stage-Build: Node baut Astro → nginx liefert `dist/`  |
| `nginx.conf`   | Saubere URLs, gzip, Cache-Header, Security-Header, 404, `/api/` |
| `server/mail.mjs` | Nimmt die Formulare entgegen und verschickt die Mail per SMTP |
| `docker-entrypoint.sh` | Startet Mail-Dienst und nginx; endet einer, stoppt der Container |
| `.dockerignore`| hält das Build-Image schlank                                 |
| `nixpacks.toml`| Fallback, falls Build-Type „Nixpacks" (pinnt Node 22)       |
| `.nvmrc`       | Node-Version 22 (Astro 7 benötigt ≥ 22.12)                  |

## ⚠️ Wichtig: Build-Type in Dokploy

Dokploy nutzt standardmäßig **Nixpacks**. Damit die schlanke nginx-Variante gebaut
wird, in der Application unter **General → Build Type** auf **Dockerfile** stellen
(Pfad `./Dockerfile`). Das ist der empfohlene Weg (kleineres Image, statische
Auslieferung über nginx).

> Falls „Nixpacks" aktiv bleibt, funktioniert der Build trotzdem: `nixpacks.toml`
> und `.nvmrc` erzwingen Node 22, und der Start-Befehl liefert den statischen Build
> per `astro preview` aus. Der Dockerfile-/nginx-Weg ist aber performanter.

## ⚠️ Pflicht: SMTP-Zugangsdaten setzen

Ohne diese Variablen nimmt die Seite Anfragen entgegen, **verschickt aber keine
Mail**. In Dokploy unter *Environment* eintragen:

| Variable           | Beispiel                              | Zweck                                  |
|--------------------|---------------------------------------|----------------------------------------|
| `SMTP_HOST`        | `smtp.ionos.de`                       | Postausgangsserver des Mailanbieters   |
| `SMTP_PORT`        | `587`                                 | 587 mit STARTTLS, 465 mit SMTPS        |
| `SMTP_SECURE`      | `false`                               | bei Port 465 auf `true` setzen         |
| `SMTP_USER`        | `kontakt@umzuege-bergstrasse.de`      | Postfach-Benutzername                  |
| `SMTP_PASS`        | `…`                                   | Postfach-Passwort                      |
| `MAIL_TO`          | `kontakt@umzuege-bergstrasse.de`      | wohin die Anfragen gehen               |
| `MAIL_FROM`        | `kontakt@umzuege-bergstrasse.de`      | Absender; muss zum Postfach passen     |
| `ALLOWED_ORIGINS`  | `https://umzuege-bergstrasse.de`      | nimmt nur Anfragen von der eigenen Seite an |

`MAIL_FROM` muss dieselbe Adresse sein wie `SMTP_USER` – die meisten Anbieter
lehnen einen abweichenden Absender ab, und bei SPF/DKIM landet die Mail sonst
im Spam. Antworten gehen trotzdem an den Interessenten: Das Skript setzt
`Reply-To` auf die im Formular angegebene Mailadresse.

**Prüfen, ob alles sitzt:** Nach dem Deployment
`https://umzuege-bergstrasse.de/api/health` aufrufen. Dort muss
`"smtp":"konfiguriert"` und `"ziel":"gesetzt"` stehen. Im Container-Log steht
beim Start ausserdem entweder `SMTP-Zugang geprueft: in Ordnung.` oder eine
konkrete Fehlermeldung.

## Schritt für Schritt (Dokploy)

1. **Projekt/Application anlegen**
   - In Dokploy: *Create → Application*.
   - Als Quelle das Git-Repository verbinden (GitHub) und den Branch wählen
     (z. B. `main`, nach dem Merge).

2. **Build-Type = Dockerfile** (wichtig!)
   - Standardmäßig steht Dokploy auf **Nixpacks** – das erzeugt ein anderes Image.
   - Unter *General → Build Type* auf **Dockerfile** stellen, Pfad `./Dockerfile`.

3. **Port**
   - Container-Port **80** angeben (nginx lauscht auf 80).

4. **Umgebungsvariable setzen** (wichtig für SEO)
   - `SITE_URL=https://ihre-domain.de`
   - Diese Variable wird beim Build für Canonicals, Open-Graph-URLs und die
     `sitemap.xml` verwendet. In Dokploy als **Build Argument** (bevorzugt) oder
     Environment-Variable hinterlegen – das `Dockerfile` liest sie via `ARG SITE_URL`.

5. **Domain & HTTPS**
   - Eigene Domain zuweisen und in Dokploy Let’s-Encrypt/TLS aktivieren.
   - Nach dem Ausrollen die Domain zusätzlich in `astro.config.mjs` bzw. über
     `SITE_URL` konsistent halten und in `public/robots.txt` die Sitemap-Zeile prüfen.

6. **Deploy**
   - *Deploy* klicken. Dokploy baut das Image und startet den Container.
   - Bei jedem Push auf den verbundenen Branch kann Dokploy automatisch neu bauen
     (Auto-Deploy aktivieren, optional).

## Lokal testen (wie in Produktion)

```bash
docker build --build-arg SITE_URL=https://ihre-domain.de -t umzuege-bergstrasse .
docker run --rm -p 8080:80 umzuege-bergstrasse
# → http://localhost:8080
```

## Nach dem ersten Deploy

- `https://ihre-domain.de/sitemap-index.xml` in der **Google Search Console** einreichen.
- Google-Business-Profil mit identischen NAP-Daten (Name/Adresse/Telefon) verknüpfen.
- Mit dem *Rich Results Test* die JSON-LD-Daten (LocalBusiness, FAQ) prüfen.
