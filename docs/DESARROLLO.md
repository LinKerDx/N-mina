# Desarrollo

## 1. Requisitos

| Herramienta | Versión | Nota |
| --- | --- | --- |
| Node.js | 22 o superior | `.nvmrc` incluido |
| pnpm | 10 u 11 | `corepack enable` |
| JDK | 21 LTS | Spring Boot 3.4 |
| Maven | 3.9 | o el wrapper del IDE |
| Docker | 24+ con Compose v2 | para el stack completo |

Verifica:

```bash
node -v && pnpm -v && java -version && mvn -v && docker compose version
```

---

## 2. Instalación

```bash
git clone <repo> nomina360 && cd nomina360

cp .env.example .env          # ajusta JWT_SECRET y contraseñas
pnpm install                  # dependencias del frontend y paquetes internos
```

> **Windows / pnpm 11**: el repo usa `nodeLinker: hoisted` (en `pnpm-workspace.yaml`)
> porque el *virtual store* global crea junctions que Node no resuelve
> (`ERR_MODULE_NOT_FOUND: fdir`). No lo cambies a `isolated` sin probar `vite build`.

---

## 3. Levantar todo con Docker

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f rh-service
```

Espera a que los healthchecks pasen (40–60 s la primera vez, Maven descarga dependencias).
Web en <http://localhost:8088>, gateway en <http://localhost:8080>.

Comandos útiles:

```bash
docker compose down            # detiene y conserva volúmenes
docker compose down -v         # detiene y borra datos (reset total)
docker compose build rh-service
```

---

## 4. Desarrollo sin Docker para los servicios Java

### 4.1 Levantar sólo las bases y RabbitMQ

```bash
docker compose up -d db-auth db-rh db-produccion db-admin rabbitmq
```

### 4.2 Ejecutar un servicio

```bash
export JAVA_HOME=/ruta/al/jdk-21     # Windows: C:\Program Files\Java\jdk-21.x
mvn -f backend/pom.xml -pl services/rh-service spring-boot:run
```

El servicio toma valores por defecto que apuntan a `localhost:5433..5436`, así que no
necesitas exportar nada más. Para apuntar a otras bases:

```bash
export RH_DB_URL=jdbc:postgresql://localhost:5434/rh_db
export RH_DB_USER=nomina_rh
export RH_DB_PASSWORD=rh_dev_pass
```

Repite con `auth-service` (8081), `produccion-service` (8083), `administracion-service`
(8084) y `api-gateway` (8080). El gateway resuelve los servicios en `localhost` por defecto.

### 4.3 Frontend

```bash
pnpm dev:web     # http://localhost:5173
```

Vite hace proxy de `/api` hacia `http://localhost:8080` (`VITE_PROXY_TARGET` para cambiarlo).

### 4.4 Todo el backend de una vez

```bash
mvn -f backend/pom.xml verify
# o crear los 5 jars y ejecutarlos por separado
mvn -f backend/pom.xml -DskipTests package
java -jar backend/services/rh-service/target/rh-service.jar
```

---

## 5. Pruebas

```bash
# Backend: motor de nómina, ISR/IMSS, prorrateo, horas extra
mvn -f backend/pom.xml test

# Frontend: formato, cliente HTTP, validaciones
pnpm test

# Calidad
pnpm lint
pnpm typecheck
pnpm build
```

La suite del motor de nómina usa valores calculados a mano (sueldo 500/día, 30 días):
ISR 1 552.78, IMSS 397.68, neto 13 049.54. Si cambias una fórmula, actualiza el test **y**
documenta la regla en `docs/ARQUITECTURA.md`.

---

## 6. Bases de datos

```bash
# psql dentro del contenedor
docker compose exec db-rh psql -U nomina_rh -d rh_db

# Ejemplos
\dt
select numero_empleado, nombre, apellido_paterno, salario_diario from empleados limit 5;
select nombre, estatus, fecha_inicio, fecha_fin from periodos_nomina;
select * from flyway_schema_history order by installed_rank desc limit 3;
```

Credenciales por defecto (cámbialas en `.env`):

| Base | Puerto | Usuario | Contraseña |
| --- | --- | --- | --- |
| auth_db | 5433 | nomina_auth | auth_dev_pass |
| rh_db | 5434 | nomina_rh | rh_dev_pass |
| produccion_db | 5435 | nomina_produccion | produccion_dev_pass |
| admin_db | 5436 | nomina_admin | admin_dev_pass |

### Reiniciar datos de demostración

```bash
docker compose down -v && docker compose up -d
```

### Agregar una migración

1. Crea `src/main/resources/db/migration/V2__descripcion.sql` en el servicio dueño.
2. **Nunca edites** una migración ya aplicada: Flyway valida checksums y el arranque falla.
3. Mantén `ddl-auto: validate`: si la entidad y el SQL no coinciden, el servicio no arranca
   (es intencional).
4. Si la migración cambia el esquema, revisa `docs/RESPALDOS.md` (respaldo antes de migrar).

---

## 7. Convenciones

- **Backend**: paquetes por capa (`api`, `dto`, `servicio`, `dominio`, `repositorio`);
  records para DTOs; sin Lombok en lógica de negocio; `BigDecimal` para dinero; inyección por
  constructor.
- **Frontend**: una feature no importa de otra feature; lo compartido va a `@nomina360/core`
  o `@nomina360/ui`; nombres de dominio en español, APIs y tipos en el idioma del contrato.
- **Commits**: `feat(rh): ...`, `fix(web): ...`, `docs: ...`, `chore(ci): ...`.
- **Secretos**: jamás en el repo; en desarrollo `.env`, en CI GitHub Environments, en
  producción un gestor de secretos.

---

## 8. Problemas frecuentes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `JAVA_HOME is not defined correctly` | Maven no encuentra el JDK | `export JAVA_HOME=/ruta/jdk-21` y que exista `$JAVA_HOME/bin/java` |
| `AccessDeniedException ~/.m2` | HOME restringido | `mvn -Dmaven.repo.local=./.m2repo ...` (o `-s` con un `settings.xml` propio) |
| `ERR_MODULE_NOT_FOUND: fdir` al hacer build | linker `isolated` en Windows | deja `nodeLinker: hoisted` en `pnpm-workspace.yaml` y reinstala |
| `spawn EPERM` al ejecutar Vite/Vitest | sandbox/antivirus bloqueando pipes | ejecuta fuera del sandbox o permite el proceso de Node |
| `docker: cannot connect to the Docker API` | Docker Desktop apagado | inícialo; `docker compose config` no requiere daemon |
| Web carga pero `/api` da 502 | gateway o servicio caído | `docker compose ps`, revisa healthchecks y logs |
| 401 inmediato al entrar | `JWT_SECRET` distinto entre gateway y servicios | usa el mismo `.env` para todos |
| 403 en el menú | el rol no tiene permiso en ese recurso | revisa la matriz en `docs/ARQUITECTURA.md` |
| Nombre de periodo duplicado | unique `(tipo, fecha_inicio)` | usa otro tipo o fecha |
| Periodo no se puede calcular | estatus distinto de `BORRADOR` o ya tiene recibos | crea un periodo nuevo |
| `PRESUPUESTO_EXCEDIDO` | el pago supera el disponible del mes | ajusta el presupuesto o el monto |

---

## 9. Flujo de trabajo recomendado

1. Rama `feat/…` desde `main`.
2. Backend: migración → entidad → repositorio → servicio → controlador → tests.
3. Frontend: tipos en `@nomina360/core` → `api.ts` de la feature → hook → componente → página.
4. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` y `mvn -f backend/pom.xml verify`.
5. Pull request con la plantilla; CI debe quedar en verde.
6. Al liberar: `git tag v1.0.0` publica imágenes en GHCR.
