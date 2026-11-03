# Respaldos — guía de operación

Los scripts de esta carpeta implementan la **capa 2** de la estrategia descrita en
[`docs/RESPALDOS.md`](../../docs/RESPALDOS.md): dump lógico por área, verificación, cifrado en
cliente y subida a S3.

| Archivo | Para qué sirve |
| --- | --- |
| `backup.sh` | Respaldo diario de las 4 bases + retención diaria |
| `restore.sh` | Restauración de un dump (descifra si es `.enc`) |
| `restore-drill.sh` | Simulacro: descarga el último respaldo, restaura y valida tablas |
| `Dockerfile` | Imagen con `pg_dump`/`pg_restore` 16, `awscli` y `openssl` |
| `docker-compose.backup.yml` | Overlay para ejecutar el respaldo dentro de la red de compose |
| `pgbackrest.conf.template` | Base para la capa 1 (PITR) |

## Ejecución local

```bash
# Fuera de Docker: apunta a las bases publicadas en localhost
export BACKUP_S3_BUCKET=nomina360-backups
export BACKUP_ENCRYPTION_PASSPHRASE='frase-larga-y-unica'
export AUTH_DB_PASSWORD=auth_dev_pass
export RH_DB_PASSWORD=rh_dev_pass
export PRODUCCION_DB_PASSWORD=produccion_dev_pass
export ADMIN_DB_PASSWORD=admin_dev_pass
bash infra/backup/backup.sh
```

El resultado se registra en `reporte.json` (un objeto por área) y en S3 bajo
`postgres/<area>/<timestamp>/`.

## Ejecución dentro de Docker

```bash
docker compose -f docker-compose.yml -f infra/backup/docker-compose.backup.yml up -d backup
docker compose logs -f backup
```

## Simulacro de restauración (obligatorio antes de confiar en el respaldo)

```bash
export BACKUP_S3_BUCKET=... BACKUP_ENCRYPTION_PASSPHRASE=...
export PGHOST=localhost PGPORT=55432 PGUSER=drill PGPASSWORD=drill
docker run --rm -d --name nomina360-drill -p 55432:5432 \
  -e POSTGRES_PASSWORD=drill postgres:16-alpine
bash infra/backup/restore-drill.sh
docker rm -f nomina360-drill
```

El script falla con código distinto de cero si un área no tiene respaldo, si el dump no
restaura o si una tabla crítica queda vacía. Ese fallo debe tratarse como incidente.

## Variables

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `BACKUP_S3_BUCKET` | sí | Bucket destino |
| `BACKUP_ENCRYPTION_PASSPHRASE` | sí | Frase de cifrado AES-256 (gestor de secretos) |
| `BACKUP_S3_ENDPOINT` | no | Para MinIO/Wasabi/B2 |
| `BACKUP_RETENTION_DAYS` | no | Retención diaria (14 por defecto) |
| `BACKUP_PRUNE` | no | `false` desactiva la limpieza |
| `DB_*_HOST` / `DB_*_PORT` | no | Por defecto `localhost:5433..5436` |
| `*_DB_PASSWORD` | sí | Credencial de la base |

## Reglas

1. El bucket vive en una **cuenta separada** con Object Lock y versionado.
2. El rol del runner **no** puede borrar objetos: la retención la aplica una política de ciclo
   de vida del bucket.
3. La frase de cifrado no se guarda junto al respaldo ni en el repositorio.
4. Un respaldo sin simulacro de restauración no cuenta como respaldo.
