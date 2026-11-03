# Estrategia de respaldos

> Respuesta corta: **pgBackRest con WAL continuo hacia S3 (Object Lock + cifrado) como capa
> principal, dumps lógicos diarios cifrados por área como capa de portabilidad, y un simulacro
> de restauración automatizado cada semana.** Todo con RPO de minutos, no de horas.

---

## 1. Punto de partida: qué hay que proteger

Nómina360 tiene cuatro bases independientes. **No se respaldan juntas**: cada una tiene su
propia ventana, su propio dueño y su propio RPO.

| Área | Base | Criticidad | Pérdida tolerable (RPO) | Recuperación objetivo (RTO) |
| --- | --- | --- | --- | --- |
| Recursos Humanos | `rh_db` | Crítica (recibos, historial laboral) | ≤ 5 min | ≤ 2 h |
| Administración | `admin_db` | Alta (pagos, presupuesto) | ≤ 15 min | ≤ 4 h |
| Autenticación | `auth_db` | Alta (accesos, auditoría) | ≤ 15 min | ≤ 2 h |
| Producción | `produccion_db` | Media (se puede recapturar el día) | ≤ 1 h | ≤ 8 h |

Además de los datos: **secretos** (`JWT_SECRET`, contraseñas de BD), configuración
(`.env`, `pgbackrest.conf`) y las **migraciones Flyway** ya versionadas en Git. Los secretos
viven en un gestor (Vault, AWS Secrets Manager, GitHub Environments), **nunca** en el respaldo
de la base ni en el repositorio.

---

## 2. Por qué un `pg_dump` diario no es suficiente

Un dump diario:

- deja una ventana de hasta 24 h de datos perdidos (inaceptable para nómina);
- no permite volver a un punto exacto antes de un cálculo o un pago erróneo;
- restaura toda la base, no un punto en el tiempo;
- si el script falla en silencio, te enteras el día que lo necesitas.

Sirve para portabilidad y para migrar entre versiones, pero **no** como única estrategia.

---

## 3. Estrategia recomendada (4 capas)

### Capa 1 — PITR continuo con pgBackRest (principal)

- Un repositorio por instancia (`[auth]`, `[rh]`, `[produccion]`, `[administracion]`).
- `archive_command` envía cada WAL segmento a S3 (asíncrono, con `archive-async=y`).
- Full semanal + diferenciales diarias + incrementales cada 6 h: menos espacio, misma
  granularidad de recuperación.
- Cifrado `repo1-cipher-type=aes-256-cbc` **en el cliente** con passphrase en el gestor de
  secretos (nunca escrita en `pgbackrest.conf` en claro).
- Objetivo: **RPO ≈ 5 minutos**, recuperación a cualquier instante dentro de la retención.

```bash
pgbackrest --stanza=rh stanza-create
pgbackrest --stanza=rh check
pgbackrest --stanza=rh backup --type=full
pgbackrest --stanza=rh backup --type=incr
# Restauración a un punto en el tiempo
pgbackrest --stanza=rh --delta --type=time --target="2026-01-31 23:59:59-06" restore
```

Configuración base: [`infra/backup/pgbackrest.conf.template`](../infra/backup/pgbackrest.conf.template).

### Capa 2 — Dump lógico diario cifrado (portabilidad)

Script: [`infra/backup/backup.sh`](../infra/backup/backup.sh) · Workflow:
[`.github/workflows/respaldo-bases.yml`](../.github/workflows/respaldo-bases.yml).

Qué hace bien:

- `pg_dump --format=custom` → restaurable con `pg_restore`, portable entre versiones y
  utilizable para extraer una sola tabla;
- **verifica el dump antes de cifrarlo** (`pg_restore --list`); si el dump está corrupto,
  falla y alerta;
- cifra en cliente con AES-256 (`openssl enc -pbkdf2`), checksum SHA-256 por archivo;
- sube a `s3://<bucket>/postgres/<área>/<timestamp>/…` con `--sse AES256`;
- retención diaria configurable (14 días por defecto);
- si un área falla, el job termina con error (no hay "éxito parcial" silencioso).

### Capa 3 — Snapshots del volumen (recuperación rápida)

Snapshot del disco (EBS/ZFS/LVM) **semanal** y antes de migraciones grandes. Sirve para
volver atrás en minutos, pero no sustituye a la capa 1: un snapshot es del volumen completo,
no del punto lógico, y puede arrastrar corrupción. En Docker Compose local no aplica; en
producción con volúmenes gestionados, actívalo.

### Capa 4 — Export inmutable (cumplimiento)

Un `pg_dump` trimestral a un bucket con **Object Lock en modo compliance** (WORM) y retención
de 5 años. La nómina es documentación laboral/fiscal con obligaciones de conservación; esta
capa no es para recuperar rápido, es para demostrar.

---

## 4. Destino, cifrado y acceso

| Decisión | Recomendación | Por qué |
| --- | --- | --- |
| Destino | S3 (o compatible: MinIO, Wasabi, Backblaze B2) | Barato, versionado, replicable |
| Inmutabilidad | Object Lock + versionado + MFA delete | Protege contra ransomware y borrados accidentales |
| Cifrado en reposo | SSE-KMS (clave propia, rotación anual) | Cumple con controles de datos personales |
| Cifrado en tránsito | TLS + cifrado cliente AES-256 | El proveedor nunca ve claro; doble capa |
| Replicación | Cross-region replication a otra región | Desastre regional |
| Cuenta separada | Bucket en una cuenta AWS distinta a la de producción | Un compromiso de credenciales no borra los respaldos |
| Permisos | Rol IAM sólo `s3:PutObject`/`GetObject` sobre el prefijo del área; escritura sin borrado para el runner | Principio de menor privilegio |
| Separación de deberes | El runner de respaldo no puede borrar; la retención la aplica una política del bucket | Evita que un script defectuoso borre todo |

**Nunca**: respaldo en el mismo host, en el mismo volumen, en el mismo proveedor sin
replicación, ni `pg_dump` sin cifrar en un bucket público.

---

## 5. Retención (GFS)

| Tipo | Retención | Dónde se aplica |
| --- | --- | --- |
| WAL | 14 días | pgBackRest (`repo1-retention-archive=4` fulls) |
| Full semanal | 8 semanas | pgBackRest (`repo1-retention-full=4` + política) |
| Diferencial diaria | 14 días | pgBackRest (`repo1-retention-diff=14`) |
| Dump lógico diario | 14 días | `backup.sh` + regla de ciclo de vida S3 |
| Dump mensual | 12 meses | Regla de ciclo de vida por prefijo `postgres/*/YYYYMM*` |
| Export anual inmutable | 5 años | Object Lock (capa 4) |

En AWS implementa los mensuales/anuales con **S3 Lifecycle** sobre el prefijo de fecha; no
recargues esa lógica al script. Así una falla del script no borra historia.

---

## 6. Automatización y monitoreo

1. **Programación**: cron del sistema (systemd timer) o GitHub Actions con runner
   *self-hosted* dentro de la red privada (los runners de GitHub no alcanzan una BD privada).
2. **Alerta de fallo** inmediata (Slack/Teams/correo) con el `correlationId` del run.
3. **Alerta de antigüedad**: si el último respaldo tiene más de 26 h, es incidente.
   Opciones: CloudWatch + SNS sobre `s3:ObjectCreated`, o un *dead man's switch*
   (healthchecks.io / Cronitor) que el script marca al terminar.
4. **Verificación semanal** con [`simulacro-restauracion.yml`](../.github/workflows/simulacro-restauracion.yml):
   restaura en un PostgreSQL desechable y comprueba que las tablas críticas tengan filas.
5. **Métrica de éxito**: porcentaje de simulacros exitosos en los últimos 90 días; si baja de
   100 %, es prioridad de equipo.

---

## 7. Runbook de restauración

### Caso A — Recuperar un área a un punto en el tiempo

```bash
# 1. Detener el servicio del área (evita escrituras durante la restauración)
docker compose stop rh-service

# 2. Restaurar con pgBackRest (PITR)
pgbackrest --stanza=rh --delta --type=time --target="2026-02-01 08:00:00-06" restore

# 3. Arrancar y verificar
docker compose start rh-service
curl -s localhost:8082/actuator/health
```

### Caso B — Restaurar un dump lógico

```bash
# 1. Descargar y descifrar
aws s3 cp s3://$BUCKET/postgres/rh/20260201T070000Z/rh_20260201T070000Z.dump.enc .
BACKUP_ENCRYPTION_PASSPHRASE=... bash infra/backup/restore.sh \
  rh_20260201T070000Z.dump.enc localhost 5434 rh_db nomina_rh "$RH_DB_PASSWORD"

# 2. Verificar integridad
psql -h localhost -p 5434 -U nomina_rh -d rh_db -c '\dt'
psql -h localhost -p 5434 -U nomina_rh -d rh_db -c 'select count(*) from recibos_nomina;'
```

### Caso C — Recuperar una sola tabla o filas

```bash
pg_restore --data-only --table=tarifas_isr --dbname=rh_db respaldo.dump
```

### Reglas del runbook

- Restaura siempre en una base **nueva** primero; nunca sobrescribas producción sin validar.
- Anota hora de inicio, hora de fin, respaldo usado y verificaciones ejecutadas.
- Después de restaurar: valida login, un periodo calculado y el último recibo; luego reabre
  el servicio.
- Si hubo pérdida de datos entre el último respaldo y el incidente, documenta el delta.

---

## 8. Alternativas evaluadas

| Herramienta | Ventaja | Cuándo usarla |
| --- | --- | --- |
| **pgBackRest** (recomendado) | PITR, paralelismo, compresión, S3 nativo, verificación de integridad | PostgreSQL autogestionado |
| WAL-G | Muy simple, multi-nube | Equipos que ya usan WAL-G en otros servicios |
| Barman | Excelente para *on-premise*, retención y catálogo | Infraestructura propia con DBA |
| Snapshots de volumen | Restauración ultrarrápida | Complemento, nunca única capa |
| `pg_dump` programado | Portable, simple | Capa 2 y migraciones |
| RDS/Aurora automated backups | Cero operación | Si migras a base gestionada |
| restic / borg | Respaldo de archivos y volúmenes | Configuración, artefactos, `.env` cifrado |
| Velero | Respaldos de clúster Kubernetes | Si despliegas en K8s |

**Recomendación final**: pgBackRest (capa 1) + dumps cifrados (capa 2) + snapshots (capa 3) +
export inmutable (capa 4), con simulacro semanal automatizado y alerta de antigüedad. Es la
combinación con mejor relación coste/riesgo para un sistema de nómina.

---

## 9. Checklist de puesta en marcha

- [ ] Bucket S3 en cuenta separada, versionado y Object Lock activados.
- [ ] Clave KMS dedicada con rotación; política que impide `s3:DeleteObject` al rol de respaldo.
- [ ] `pgbackrest.conf` desplegado con passphrase desde el gestor de secretos.
- [ ] `archive_command` configurado y `pgbackrest check` en verde en las 4 instancias.
- [ ] Full inicial + 1 diferencial + 1 incremental verificados.
- [ ] `backup.sh` programado y ejecutado con éxito (revisar `reporte.json`).
- [ ] Alerta de fallo y alerta de antigüedad (> 26 h) configuradas y probadas.
- [ ] `simulacro-restauracion.yml` ejecutado al menos una vez con éxito.
- [ ] Runbook impreso y accesible sin depender del sistema caído.
- [ ] Retención GFS definida por escrito y aprobada por finanzas/legal.
- [ ] Prueba de restauración completa con cronómetro (medir RTO real).

---

## 10. Antipatrones que debes evitar

- Respaldos sólo en el mismo servidor o en el mismo volumen de Docker.
- `pg_dump` sin cifrar en un bucket compartido con el equipo.
- Scripts que "avisan" por correo y nadie lee: usa alertas con responsable.
- Nunca restaurar: el respaldo no probado es una hipótesis, no una garantía.
- Guardar el respaldo en el mismo repositorio Git o en el pipeline como artefacto público.
- Rotar contraseñas de BD sin actualizar el gestor de secretos del respaldo.
- Confundir alta disponibilidad (réplica) con respaldo: una réplica replica también el `DELETE`.
