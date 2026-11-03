#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Respaldo lógico cifrado por área (capa 2 de la estrategia de respaldos).
#
# - pg_dump formato custom (restaurable con pg_restore, portable entre versiones)
# - verificación del dump ANTES de cifrar (pg_restore --list)
# - cifrado en cliente con AES-256 (openssl PBKDF2) y checksum SHA-256
# - subida a S3 compatible con cifrado del servidor (SSE)
# - retención diaria configurable (para GFS usa reglas de ciclo de vida en S3)
#
# Variables requeridas:
#   BACKUP_S3_BUCKET, BACKUP_ENCRYPTION_PASSPHRASE y las credenciales de cada BD.
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKDIR="${WORKDIR:-$SCRIPT_DIR/tmp}"
REPORTE="${REPORTE:-$SCRIPT_DIR/reporte.json}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RETENCION_DIAS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$WORKDIR"
limpiar() {
  rm -f "$WORKDIR"/*.dump "$WORKDIR"/*.enc "$WORKDIR"/*.sha256 2>/dev/null || true
}
trap limpiar EXIT

requerir() {
  local nombre="$1"
  if [ -z "${!nombre:-}" ]; then
    echo "ERROR: falta la variable de entorno $nombre" >&2
    exit 1
  fi
}

requerir BACKUP_S3_BUCKET
requerir BACKUP_ENCRYPTION_PASSPHRASE

AWS_ARGS=()
if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
  AWS_ARGS+=(--endpoint-url "$BACKUP_S3_ENDPOINT")
fi

# area|host|puerto|base|usuario|variable_de_password
AREAS=(
  "auth|${DB_AUTH_HOST:-localhost}|${DB_AUTH_PORT:-5433}|${AUTH_DB_NAME:-auth_db}|${AUTH_DB_USER:-nomina_auth}|AUTH_DB_PASSWORD"
  "rh|${DB_RH_HOST:-localhost}|${DB_RH_PORT:-5434}|${RH_DB_NAME:-rh_db}|${RH_DB_USER:-nomina_rh}|RH_DB_PASSWORD"
  "produccion|${DB_PRODUCCION_HOST:-localhost}|${DB_PRODUCCION_PORT:-5435}|${PRODUCCION_DB_NAME:-produccion_db}|${PRODUCCION_DB_USER:-nomina_produccion}|PRODUCCION_DB_PASSWORD"
  "administracion|${DB_ADMIN_HOST:-localhost}|${DB_ADMIN_PORT:-5436}|${ADMIN_DB_NAME:-admin_db}|${ADMIN_DB_USER:-nomina_admin}|ADMIN_DB_PASSWORD"
)

echo "[" > "$REPORTE"
primero=1
fallos=0

for entrada in "${AREAS[@]}"; do
  IFS='|' read -r area host puerto base usuario variable_password <<< "$entrada"
  password="${!variable_password:-}"
  if [ -z "$password" ]; then
    echo "ERROR: falta $variable_password para el área $area" >&2
    fallos=$((fallos + 1))
    continue
  fi

  archivo="$WORKDIR/${area}_${STAMP}.dump"
  destino="s3://${BACKUP_S3_BUCKET}/postgres/${area}/${STAMP}/${area}_${STAMP}.dump.enc"

  echo "==> [$area] pg_dump ${base} en ${host}:${puerto}"
  if ! PGPASSWORD="$password" pg_dump \
      --host "$host" --port "$puerto" --username "$usuario" --dbname "$base" \
      --format=custom --compress=9 --no-owner --no-privileges \
      --file "$archivo"; then
    echo "ERROR: falló pg_dump de $area" >&2
    fallos=$((fallos + 1))
    continue
  fi

  # Verificación de integridad del dump antes de cifrarlo
  if ! pg_restore --list "$archivo" > /dev/null 2>&1; then
    echo "ERROR: el dump de $area no es un archivo válido" >&2
    fallos=$((fallos + 1))
    continue
  fi

  openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
    -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
    -in "$archivo" -out "${archivo}.enc"
  rm -f "$archivo"

  bytes="$(wc -c < "${archivo}.enc" | tr -d ' ')"
  checksum="$(sha256sum "${archivo}.enc" | awk '{print $1}')"
  printf '%s  %s\n' "$checksum" "$(basename "$destino")" > "${archivo}.enc.sha256"

  echo "==> [$area] subiendo $(basename "$destino") (${bytes} bytes)"
  if ! aws "${AWS_ARGS[@]}" s3 cp "${archivo}.enc" "$destino" --sse AES256 --only-show-errors; then
    echo "ERROR: no se pudo subir el respaldo de $area" >&2
    fallos=$((fallos + 1))
    continue
  fi
  aws "${AWS_ARGS[@]}" s3 cp "${archivo}.enc.sha256" "${destino}.sha256" --sse AES256 --only-show-errors

  if [ "$primero" -eq 1 ]; then
    primero=0
  else
    echo "," >> "$REPORTE"
  fi
  printf '  {"area":"%s","base":"%s","objeto":"%s","bytes":%s,"sha256":"%s","fecha":"%s"}' \
    "$area" "$base" "${destino#s3://${BACKUP_S3_BUCKET}/}" "$bytes" "$checksum" "$STAMP" >> "$REPORTE"

  rm -f "${archivo}.enc" "${archivo}.enc.sha256"
done

echo "" >> "$REPORTE"
echo "]" >> "$REPORTE"

# Retención diaria (los respaldos semanales/mensuales se conservan con reglas
# de ciclo de vida del bucket; ver docs/RESPALDOS.md)
if [ "${BACKUP_PRUNE:-true}" = "true" ] && [ "$fallos" -eq 0 ]; then
  limite="$(date -u -d "-${RETENCION_DIAS} days" +%Y%m%dT%H%M%SZ 2>/dev/null \
    || date -u -v-"${RETENCION_DIAS}"d +%Y%m%dT%H%M%SZ)"
  for entrada in "${AREAS[@]}"; do
    IFS='|' read -r area _ _ _ _ _ <<< "$entrada"
    while read -r _ _ _ prefijo; do
      [ -z "${prefijo:-}" ] && continue
      if [[ "$prefijo" < "${limite}/" ]]; then
        echo "==> [$area] eliminando respaldo fuera de retención: $prefijo"
        aws "${AWS_ARGS[@]}" s3 rm "s3://${BACKUP_S3_BUCKET}/postgres/${area}/${prefijo}" \
          --recursive --only-show-errors || true
      fi
    done < <(aws "${AWS_ARGS[@]}" s3 ls "s3://${BACKUP_S3_BUCKET}/postgres/${area}/" || true)
  done
else
  echo "==> Retención omitida (BACKUP_PRUNE=${BACKUP_PRUNE:-true}, fallos=${fallos})"
fi

if [ "$fallos" -gt 0 ]; then
  echo "RESPALDO INCOMPLETO: $fallos área(s) con error. Revisar el runbook." >&2
  exit 1
fi

echo "Respaldo completado. Reporte: $REPORTE"
