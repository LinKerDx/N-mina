#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Simulacro de restauración: descarga el respaldo más reciente de cada área,
# lo restaura en un PostgreSQL desechable y valida que las tablas críticas
# tengan filas. Falla con exit code != 0 si algo no cuadra.
#
# Variables: BACKUP_S3_BUCKET, BACKUP_ENCRYPTION_PASSPHRASE, PGHOST, PGPORT,
#            PGUSER, PGPASSWORD (servidor desechable).
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKDIR="${WORKDIR:-$SCRIPT_DIR/tmp-drill}"
REPORTE="${REPORTE:-$SCRIPT_DIR/drill-reporte.json}"

: "${BACKUP_S3_BUCKET:?define BACKUP_S3_BUCKET}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?define BACKUP_ENCRYPTION_PASSPHRASE}"
: "${PGHOST:?define PGHOST del servidor de simulacro}"
: "${PGPORT:?define PGPORT}"
: "${PGUSER:?define PGUSER}"
: "${PGPASSWORD:?define PGPASSWORD}"

AWS_ARGS=()
if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
  AWS_ARGS+=(--endpoint-url "$BACKUP_S3_ENDPOINT")
fi

mkdir -p "$WORKDIR"
rm -f "$WORKDIR"/*.dump "$WORKDIR"/*.enc 2>/dev/null || true

declare -A TABLAS_CRITICAS=(
  ["auth"]="usuarios refresh_tokens"
  ["rh"]="empleados periodos_nomina recibos_nomina tarifas_isr"
  ["produccion"]="registros_horas centros_trabajo turnos"
  ["administracion"]="presupuestos pagos centros_costo"
)

echo "[" > "$REPORTE"
primero=1
errores=0

for area in auth rh produccion administracion; do
  echo "==> [$area] buscando el respaldo más reciente"
  prefijo="$(aws "${AWS_ARGS[@]}" s3 ls "s3://${BACKUP_S3_BUCKET}/postgres/${area}/" \
    | awk '{print $2}' | sort | tail -n 1)"

  if [ -z "${prefijo:-}" ]; then
    echo "ERROR: no hay respaldos para $area" >&2
    errores=$((errores + 1))
    continue
  fi

  objeto="$(aws "${AWS_ARGS[@]}" s3 ls "s3://${BACKUP_S3_BUCKET}/postgres/${area}/${prefijo}" \
    | awk '{print $4}' | grep '\.dump\.enc$' | head -n 1)"

  if [ -z "${objeto:-}" ]; then
    echo "ERROR: el prefijo ${prefijo} no contiene un .dump.enc" >&2
    errores=$((errores + 1))
    continue
  fi

  aws "${AWS_ARGS[@]}" s3 cp "s3://${BACKUP_S3_BUCKET}/postgres/${area}/${prefijo}${objeto}" \
    "$WORKDIR/${objeto}" --only-show-errors

  dump="$WORKDIR/${area}_drill.dump"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
    -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
    -in "$WORKDIR/${objeto}" -out "$dump"

  base="drill_${area}"

  psql -d postgres -v ON_ERROR_STOP=1 -q \
    -c "DROP DATABASE IF EXISTS ${base}" \
    -c "CREATE DATABASE ${base}"

  pg_restore --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$base" \
    --no-owner --no-privileges --exit-on-error "$dump" > /dev/null

  for tabla in ${TABLAS_CRITICAS[$area]}; do
    filas="$(psql -d "$base" -tAc "select count(*) from ${tabla}")"
    if [ "${filas:-0}" -le 0 ]; then
      echo "ERROR: la tabla ${tabla} quedó vacía en $area" >&2
      errores=$((errores + 1))
    fi
    echo "    [$area] ${tabla}: ${filas} filas"
  done

  if [ "$primero" -eq 1 ]; then
    primero=0
  else
    echo "," >> "$REPORTE"
  fi
  printf '  {"area":"%s","respaldo":"%s","base":"%s","estado":"restaurado"}' \
    "$area" "${prefijo}${objeto}" "$base" >> "$REPORTE"

  rm -f "$dump" "$WORKDIR/${objeto}"
done

echo "" >> "$REPORTE"
echo "]" >> "$REPORTE"

if [ "$errores" -gt 0 ]; then
  echo "SIMULACRO FALLIDO: $errores problema(s). Un respaldo que no restaura no es un respaldo." >&2
  exit 1
fi

echo "Simulacro de restauración exitoso. Reporte: $REPORTE"
