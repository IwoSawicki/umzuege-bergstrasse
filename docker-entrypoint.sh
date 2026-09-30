#!/bin/sh
# Startet den Mail-Dienst und nginx im selben Container.
# Beendet sich einer von beiden, endet auch der Container: Sonst liefe die
# Seite weiter aus, waehrend die Formulare still ins Leere laufen – genau
# der Zustand, der vorher wochenlang unbemerkt blieb.
set -e

node /app/server/mail.mjs &
MAIL_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

beenden() {
  kill "$MAIL_PID" "$NGINX_PID" 2>/dev/null || true
  wait "$MAIL_PID" "$NGINX_PID" 2>/dev/null || true
  exit 0
}
trap beenden TERM INT

# Auf den ersten Prozess warten, der sich beendet
wait -n "$MAIL_PID" "$NGINX_PID"
echo "Ein Dienst hat sich beendet – Container wird gestoppt." >&2
beenden
