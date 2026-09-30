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

## ⚠️ Pflicht: Mailversand einrichten

Ohne diese Variablen nimmt die Seite Anfragen entgegen, **verschickt aber keine
Mail**. In Dokploy unter *Environment* eintragen.

### Der kurze Weg: Anbieter-Voreinstellung

Für die gängigen Anbieter reichen **drei Zeilen**. `MAIL_PRESET` setzt Server,
Port und Verschlüsselung automatisch richtig – das ist die häufigste
Fehlerquelle (Port 587 braucht STARTTLS, Port 465 braucht SMTPS).

```
MAIL_PRESET=gmail
SMTP_USER=deine-adresse@example.com
SMTP_PASS=dein-app-passwort
```

Mögliche Werte für `MAIL_PRESET`: `gmail`, `ionos`, `strato`, `hetzner`,
`mailbox`, `office365`.

`MAIL_TO` und `MAIL_FROM` fallen automatisch auf `SMTP_USER` zurück,
`ALLOWED_ORIGINS` auf `https://umzuege-bergstrasse.de`.

### Google / Gmail: App-Passwort statt Kontopasswort

**Niemals das Google-Kontopasswort eintragen.** Google akzeptiert es bei
aktivierter Zwei-Faktor-Anmeldung ohnehin nicht. Stattdessen:

1. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) öffnen
2. Name vergeben (z. B. „Website Formular"), erstellen
3. Den 16-stelligen Code kopieren und als `SMTP_PASS` eintragen

Der Code taugt ausschließlich zum Mailversand, nicht zum Anmelden, und lässt
sich jederzeit einzeln widerrufen. Leerzeichen im Code darf man
mitkopieren – der Dienst entfernt sie selbst.

### Alle Variablen im Einzelnen

| Variable           | Pflicht | Zweck                                       |
|--------------------|---------|---------------------------------------------|
| `MAIL_PRESET`      | –       | setzt Host, Port und Verschlüsselung        |
| `SMTP_USER`        | ✔       | Postfach-Benutzername                       |
| `SMTP_PASS`        | ✔       | App-Passwort bzw. Postfach-Passwort         |
| `SMTP_HOST`        | –       | nur nötig ohne Preset                       |
| `SMTP_PORT`        | –       | nur nötig ohne Preset                       |
| `SMTP_SECURE`      | –       | `true` bei Port 465, sonst `false`          |
| `MAIL_TO`          | –       | Ziel der Anfragen (Standard: `SMTP_USER`)   |
| `MAIL_FROM`        | –       | Absender (Standard: `SMTP_USER`)            |
| `ALLOWED_ORIGINS`  | –       | erlaubte Herkunft der Formulare             |
| `SERVE_STATIC`     | –       | nur im Betrieb ohne nginx (setzt `npm start`) |

`MAIL_FROM` muss zur Adresse in `SMTP_USER` passen – die meisten Anbieter
lehnen einen abweichenden Absender ab, und bei SPF landet die Mail sonst im
Spam. Antworten gehen trotzdem an den Interessenten: Der Dienst setzt
`Reply-To` auf die im Formular angegebene Mailadresse.

> **Falls der Build-Type auf „Nixpacks" steht:** Dann läuft nicht das
> Dockerfile, sondern `npm start`. Auch das funktioniert – der Mail-Dienst
> liefert in dem Fall die statischen Seiten gleich mit aus (`SERVE_STATIC`).
> Empfohlen bleibt „Dockerfile": nginx liefert schneller aus und setzt die
> Cache- und Security-Header.

**Prüfen, ob alles sitzt:** Nach dem Deployment
`https://umzuege-bergstrasse.de/api/health` aufrufen. So sieht es aus, wenn
alles steht:

```json
{"ok":true,"transport":"smtp","smtp":"konfiguriert","passwort":"gesetzt","ziel":"gesetzt","anmeldung":"in Ordnung"}
```

- `"anmeldung":"in Ordnung"` heisst: Der Mailserver hat die Zugangsdaten
  tatsächlich akzeptiert. Nur das beweist, dass der Versand funktioniert –
  `konfiguriert` und `gesetzt` sagen bloss, dass die Werte angekommen sind.
- Steht dort `FEHLER: …`, ist der Grund gleich mitgenannt (z. B.
  `Invalid login` bei falschem App-Passwort). Zugangsdaten werden aus der
  Meldung entfernt, die Adresse ist also öffentlich unbedenklich.
- Steht bei `smtp`, `passwort` oder `ziel` `FEHLT`, sind die Variablen nicht
  im Container angekommen. Häufigste Ursachen: nach dem Speichern **kein
  Redeploy** ausgelöst (Dokploy übernimmt Environment-Variablen erst beim
  Neustart), oder sie stehen unter *Build Arguments* statt unter
  *Environment*. Das Container-Log zeigt beim Start mit
  `[Mail] Variablen vorhanden: …` / `[Mail] Variablen fehlen: …`, welche
  Namen wirklich durchkommen – nie deren Werte.
- `…/api/health?pruefen=1` fragt den Mailserver frisch, statt den beim Start
  gemerkten Zustand zu zeigen – praktisch, wenn Sie gerade ein neues
  App-Passwort eingetragen haben.

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
