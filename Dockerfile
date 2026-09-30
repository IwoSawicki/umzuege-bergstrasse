# ---------- Build-Stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Build-Zeit-Variable für die Produktions-Domain (Canonicals/Sitemap/OG).
# In Dokploy unter "Build Arguments" bzw. Environment setzen: SITE_URL=https://ihre-domain.de
ARG SITE_URL=https://umzuege-bergstrasse.de
ENV SITE_URL=$SITE_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Abhängigkeiten für die Laufzeit ----------
# Nur was der Mail-Dienst braucht (nodemailer) – Astro und Tailwind sind
# devDependencies und bleiben in der Build-Stage.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Serve-Stage ----------
# node-Image statt nginx-Image, weil hier zwei Dinge laufen: nginx liefert
# die statischen Seiten aus (Gzip, Caching, Security-Header), daneben der
# kleine Node-Dienst für die Formulare unter /api/.
FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache nginx && mkdir -p /run/nginx

COPY nginx.conf /etc/nginx/http.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=deps /app/node_modules /app/node_modules
COPY server /app/server
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 80
# Prüft beides: die ausgelieferte Seite und den Mail-Dienst dahinter.
HEALTHCHECK --interval=30s --timeout=5s --start-period=8s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 && \
      wget -qO- http://127.0.0.1/api/health >/dev/null 2>&1 || exit 1
CMD ["/app/docker-entrypoint.sh"]
