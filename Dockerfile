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

# ---------- Serve-Stage ----------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
