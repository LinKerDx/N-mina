#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Restaura un respaldo lógico de Nómina360.
#
# Uso:
#   BACKUP_ENCRYPTION_PASSPHRASE=... \
#   ./restore.sh <archivo.dump.enc|archivo.dump> <host> <puerto> <base> <usuario> <password>
#
# El respaldo se descifra en local y se restaura con pg_restore --clean.
# PELIGRO: --clean elimina los objetos existentes en la base destino.
# ---------------------------------------------------------------------------
set -euo pipefail

uso() {
  echo "Uso: $0 <archivo.dump.enc|archivo.dump> <host> <puerto> <base> <usuario> <password>" >&2
  exit 1
}

[ "$#" -eq 6 ] || uso

ARCHIVO="$1"
HOST="$2"
PUERTO="$3"
BASE="$4"
USUARIO="$5"
PASSWORD="$6"

[ -f "$ARCHIVO" ] || { echo "No existe el archivo $ARCHIVO" >&2; exit 1; }

temporal=""
if [[ "$ARCHIVO" == *.enc ]]; then
  : "${BACKUP_ENCRYPTION_PASSPHRASE:?define BACKUP_ENCRYPTION_PASSPHRASE para descifrar}"
  temporal="$(mktemp --suffix=.dump)"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
    -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
    -in "$ARCHIVO" -out "$temporal"
  origen="$temporal"
else
  origen="$ARCHIVO"
fi

echo "==> Restaurando $(basename "$ARCHIVO") en ${BASE}@${HOST}:${PUERTO}"
PGPASSWORD="$PASSWORD" pg_restore \
  --host "$HOST" --port "$PUERTO" --username "$USUARIO" --dbname "$BASE" \
  --clean --if-exists --no-owner --no-privileges --verbose \
  "$origen"

[ -n "$temporal" ] && rm -f "$temporal"

echo "==> Restauración terminada. Verifica con:"
echo "    psql -h $HOST -p $PUERTO -U $USUARIO -d $BASE -c '\\dt'"
