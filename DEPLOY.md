# Deployment mit Dokploy

Die Website wird als **statischer Build** erzeugt und in einem schlanken **nginx**-Container
ausgeliefert. Dokploy baut das mitgelieferte `Dockerfile` und startet den Container.

## Enthaltene Dateien

| Datei          | Zweck                                                        |
|----------------|-------------------------------------------------------------|
| `Dockerfile`   | Multi-Stage-Build: Node baut Astro → nginx liefert `dist/`  |
| `nginx.conf`   | Saubere URLs, gzip, Cache-Header, Security-Header, 404       |
| `.dockerignore`| hält das Build-Image schlank                                 |

## Schritt für Schritt (Dokploy)

1. **Projekt/Application anlegen**
   - In Dokploy: *Create → Application*.
   - Als Quelle das Git-Repository verbinden (GitHub) und den Branch wählen
     (z. B. `main`, nach dem Merge).

2. **Build-Type = Dockerfile**
   - Dokploy erkennt das `Dockerfile` im Repo-Root automatisch. Falls nicht:
     Build-Type manuell auf **Dockerfile** stellen, Pfad `./Dockerfile`.

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
