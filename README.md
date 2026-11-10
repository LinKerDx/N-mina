# Nómina360

Sistema de control de nóminas **multiárea** construido como **monorepo multipaquete**:
un frontend React con *Screaming Architecture* y cinco microservicios Java (Spring Boot, MVC)
con **una base de datos PostgreSQL por área**.

> Estado: scaffold ejecutable de punta a punta (login → empleados → periodos → cálculo →
> aprobación de horas → pago contra presupuesto). Las tablas fiscales incluidas son de
> referencia y deben validarse antes de operar con nómina real (ver [límites](#límites-conocidos)).

---

## Lo que incluye

| Área | Capacidad | Dónde |
| --- | --- | --- |
| Autenticación | Login JWT, refresh rotativo, roles por área | `backend/services/auth-service` |
| Recursos Humanos | Empleados, incidencias, periodos, cálculo de ISR/IMSS, recibos | `backend/services/rh-service` |
| Recibos PDF | Recibo con datos completos del trabajador y desglose de percepciones/deducciones | `backend/services/rh-service/.../ReciboPdfService.java` |
| Portal del empleado | Rol `EMPLEADO`: “Mi nómina”, desglose, datos personales y PDF | `apps/web/src/features/mi-nomina` |
| Producción | Centros de trabajo, turnos, horas, aprobación y evento a RH | `backend/services/produccion-service` |
| Administración | Centros de costo, presupuesto, proveedores, pagos | `backend/services/administracion-service` |
| Borde | Ruteo, CORS, validación de JWT, correlation ID | `backend/services/api-gateway` |
| Web | Login animado (anime.js), tablero, nómina, empleados, producción, presupuesto | `apps/web` |

---

## Arquitectura en 30 segundos

```mermaid
flowchart LR
  U[Usuario] --> W[Web · React + Tailwind]
  W -->|/api| G[API Gateway<br/>JWT + CORS + correlación]
  G --> A[auth-service<br/>auth_db]
  G --> R[rh-service<br/>rh_db]
  G --> P[produccion-service<br/>produccion_db]
  G --> D[administracion-service<br/>admin_db]
  P -. evento horas aprobadas .-> Q[(RabbitMQ)]
  Q -. consumidor idempotente .-> R
```

- **Database per service**: `auth_db`, `rh_db`, `produccion_db`, `admin_db` en instancias
  PostgreSQL separadas (puertos 5433–5436). Ningún servicio lee la base de otro.
- **Comunicación síncrona** sólo a través del gateway (REST/JSON).
- **Comunicación asíncrona** para el flujo Producción → RH con patrón *outbox* y consumidor
  idempotente (`eventos_procesados`).
- Cada servicio sigue un MVC por capas: `api/` (controladores) → `servicio/` (casos de uso)
  → `dominio/` + `repositorio/`.

Detalle completo: [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) · Decisiones: [docs/DECISIONES.md](docs/DECISIONES.md)

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 3.4, anime.js 3, React Router 7 |
| Estado/HTTP | TanStack Query para consultas y mutaciones, Zustand para la sesión y cliente HTTP tipado en `@nomina360/core` (refresh transparente de JWT) |
| Backend | Java 21, Spring Boot 3.4, Spring Security, Spring Data JPA, Flyway, Spring Cloud Gateway |
| Mensajería | RabbitMQ 3.13 (topic exchange + dead-letter queue + outbox) |
| Datos | PostgreSQL 16, una instancia por área |
| Infra | Docker Compose, imágenes multi-stage, GitHub Actions, GHCR |
| Calidad | JUnit 5 + AssertJ, Vitest + Testing Library, ESLint 9, TypeScript estricto, Prettier |

---

## Arranque rápido

Requisitos: Docker Desktop (o Docker + Compose v2) y Node 22+. Para desarrollo sin Docker,
ver [docs/DESARROLLO.md](docs/DESARROLLO.md).

```bash
pnpm install                  # una sola vez
pnpm nomina:doctor            # revisa Node, pnpm, Docker, JDK y Maven
pnpm nomina:up                # crea .env, construye y levanta todo
```

`nomina:up` espera a que los servicios respondan y te imprime las URLs. Equivale a:

```bash
cp .env.example .env          # cambia JWT_SECRET y contraseñas
docker compose up --build -d
```

| Script | Para qué |
| --- | --- |
| `pnpm nomina:up` | Levanta el stack completo (web + API + 4 bases + RabbitMQ) |
| `pnpm nomina:dev` | Bases en Docker y microservicios/Vite en local (recarga en caliente) |
| `pnpm nomina:check` | `mvn verify` + lint + typecheck + tests + build |
| `pnpm nomina:doctor` | Diagnóstico de requisitos |
| `pnpm nomina:status` / `pnpm nomina:logs rh-service` | Estado y logs |
| `pnpm nomina:down` (`--datos`) | Detiene el stack (y borra los datos) |
| `pnpm nomina:backup` | Respaldo cifrado de las cuatro bases |

Prefijo `nomina:` a propósito: `pnpm up` y `pnpm doctor` son comandos nativos de pnpm y no
deben confundirse. Detalle de cada comando: [`scripts/README.md`](scripts/README.md). En
Linux/macOS los mismos comandos funcionan igual (el CLI es Node, no PowerShell).

| Servicio | URL |
| --- | --- |
| Web | http://localhost:8088 |
| API Gateway | http://localhost:8080 |
| Swagger auth | http://localhost:8081/swagger-ui.html |
| Swagger RH | http://localhost:8082/swagger-ui.html |
| Swagger Producción | http://localhost:8083/swagger-ui.html |
| Swagger Administración | http://localhost:8084/swagger-ui.html |
| RabbitMQ (consola) | http://localhost:15672 (`nomina` / `nomina_dev_pass`) |
| PostgreSQL auth / RH / producción / admin | `localhost:5433` / `5434` / `5435` / `5436` |

### Usuarios de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@nomina360.mx` | `Nomina360!` |
| Recursos Humanos | `rh@nomina360.mx` | `Nomina360!` |
| Producción | `produccion@nomina360.mx` | `Nomina360!` |
| Administración | `admin.finanzas@nomina360.mx` | `Nomina360!` |
| Empleada (autoservicio) | `ana.lopez@nomina360.mx` | `Nomina360!` |
| Empleado (autoservicio) | `luis.ramirez@nomina360.mx` | `Nomina360!` |
| Empleada (autoservicio) | `marta.sanchez@nomina360.mx` | `Nomina360!` |

Los usuarios se crean al primer arranque de `auth-service` (desactívalo con
`NOMINA_DATOS_INICIALES_ENABLED=false`). **Cámbialos antes de usar datos reales.**

Las cuentas de empleado comparten correo con su ficha de `rh_db`: con eso el portal resuelve
"mi nómina" sin duplicar identidades entre microservicios.

### Recorrido sugerido

1. Entra como `rh@nomina360.mx` → **Nómina** → abre *Enero 2026* → **Calcular**.
2. Revisa **Ver recibos**: percepciones, ISR, IMSS y neto por empleado. El botón
   **PDF** de cada recibo descarga el documento con los datos del trabajador.
3. Entra como `produccion@nomina360.mx` → **Producción** → aprueba un registro con horas extra.
4. Vuelve a RH: las horas se integran como incidencia vía RabbitMQ (evento idempotente).
5. Entra como `admin.finanzas@nomina360.mx` → **Administración** → registra un pago y observa
   cómo se reduce el disponible del centro de costo.
6. Entra como `ana.lopez@nomina360.mx` → **Mi nómina** → **Ver desglose** y descarga el PDF.
   Ese rol solo ve sus propios recibos.

---

## Estructura del repositorio

```text
nomina360/
├── apps/
│   └── web/                        # React + Vite + Tailwind (Screaming Architecture)
│       ├── src/
│       │   ├── app/                # composición: rutas y App
│       │   ├── shell/              # layout, navegación, iconos
│       │   ├── shared/             # hooks, componentes y utilidades transversales
│       │   └── features/
│       │       ├── auth/           # api · contexto · animaciones (anime.js) · pages
│       │       ├── dashboard/
│       │       ├── empleados/
│       │       ├── nomina/
│       │       ├── produccion/
│       │       └── administracion/
│       └── Dockerfile · nginx.conf
├── packages/
│   ├── core/                       # tipos, cliente HTTP, formato, validaciones zod
│   ├── ui/                         # design system compartido (botones, tablas, modales…)
│   └── tsconfig/                   # baselines de TypeScript
├── backend/
│   ├── libs/
│   │   ├── common-jwt/             # emisión/validación de JWT
│   │   ├── common-web/             # ApiError, paginación, correlación, excepciones
│   │   └── common-security/        # filtro JWT, SecurityFilterChain, BCrypt
│   ├── services/
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── rh-service/
│   │   ├── produccion-service/
│   │   └── administracion-service/
│   ├── pom.xml                     # reactor Maven (multi-módulo)
│   └── Dockerfile                  # imagen multi-stage compartida
├── infra/backup/                   # scripts de respaldo, cifrado, simulacro y pgBackRest
├── scripts/                        # CLI de operación (up, dev, check, doctor, logs, backup)
├── docs/                           # arquitectura, API, decisiones, desarrollo, respaldos
├── .github/workflows/              # CI backend/frontend, imágenes, respaldo, simulacro
└── docker-compose.yml              # 4 BD + RabbitMQ + 5 servicios + web
```

---

## Comandos

```bash
# Frontend
pnpm install
pnpm dev:web              # http://localhost:5173 (proxy /api → gateway :8080)
pnpm build                # turbo: build de todos los paquetes
pnpm test                 # Vitest (core + web)
pnpm lint && pnpm typecheck

# Backend
export JAVA_HOME=/ruta/al/jdk-21
mvn -f backend/pom.xml verify
mvn -f backend/pom.xml -pl services/rh-service spring-boot:run

# Stack completo
docker compose up --build -d
docker compose logs -f rh-service
docker compose down -v    # elimina también los volúmenes de datos
```

---

## Calidad y CI

| Workflow | Qué hace |
| --- | --- |
| `ci-backend.yml` | `mvn verify` (JUnit del motor de nómina) + build de las 5 imágenes |
| `ci-frontend.yml` | lint, typecheck, Vitest y build de producción |
| `publicar-imagenes.yml` | publica imágenes en GHCR al etiquetar `v*.*.*` |
| `respaldo-bases.yml` | respaldo lógico diario cifrado a S3 (runner self-hosted) |
| `simulacro-restauracion.yml` | restaura el último respaldo y valida tablas críticas |
| `dependabot.yml` | actualizaciones semanales de Maven, npm, Docker y Actions |

El motor de nómina tiene pruebas con valores calculados a mano (sueldo, ISR, IMSS,
prorrateo por ingreso, faltas y horas extra dobles/triples) para evitar regresiones.

---

## Respaldos

La recomendación completa está en **[docs/RESPALDOS.md](docs/RESPALDOS.md)**. Resumen:

1. **PITR con pgBackRest** por instancia (WAL continuo + full/incr) → RPO ≈ 5 min.
2. **Dump lógico diario** cifrado por base (`infra/backup/backup.sh`) → portabilidad y
   recuperación por área.
3. **S3 con Object Lock / versionado + cifrado**, copia en otra región, retención GFS.
4. **Simulacro de restauración automatizado** semanal: un respaldo que no se restaura no existe.

---

## Límites conocidos

- Las **tarifas de ISR y cuotas del IMSS** son valores de referencia (2025) con fines de
  demostración. Antes de producción: carga las tablas oficiales vigentes y valídalas con tu
  contador. No se implementan subsidio al empleo, ajuste anual, CFDI de nómina ni dispersión
  bancaria.
- El cálculo asume jornada de 8 horas y horas extra semanales (9 al doble, resto al triple).
- No hay notificaciones por correo ni recálculo de periodos cerrados: un periodo se calcula
  una vez (inmutabilidad contable) y se corrige con un periodo nuevo.
- El refresh de JWT se renueva por petición; para alta concurrencia conviene una cola de
  renovación o *grace period* de refresh tokens.

## Estado verificado

El stack completo se levantó y probó en Windows con Docker Desktop (11 contenedores):

| Verificación | Resultado |
| --- | --- |
| `pnpm nomina:up` | Construye y espera a los 5 servicios; login inmediato al terminar |
| Contenedores | 11/11 `healthy` (4 BD, RabbitMQ, 5 servicios, gateway y web) |
| Login JWT + `/me` | OK; roles y `X-Correlation-Id` propagados |
| Cálculo de nómina | 8 recibos, ISR e IMSS coherentes, periodo pasa a `CALCULADO` |
| Producción → RH | Evento por RabbitMQ convertido en incidencia idempotente |
| Presupuesto | Pago descuenta disponible; excedido devuelve 422 `PRESUPUESTO_EXCEDIDO` |
| Seguridad | 401 sin token, 403 por rol, 409 al recalcular, 422 de negocio |
| Recibo PDF | 200 `application/pdf`, 11 KB, datos del trabajador + desglose + neto |
| Portal del empleado | Login `EMPLEADO`, perfil, 1 recibo con 4 conceptos y PDF 200 |
| Aislamiento | Recibo de otro empleado → 404; RH en portal → 403; empleado en RH → 403 |
| Web y Swagger | Web 200 con bundle; OpenAPI 200 en RH |

## Próximos pasos sugeridos

- Sustituir las tarifas demo por tablas fiscales versionadas por ejercicio (`V2__...`).
- Añadir Testcontainers para pruebas de integración de repositorios y Flyway.
- Generar el cliente TypeScript desde OpenAPI (`openapi-typescript`) y eliminar los tipos manuales.
- Observabilidad: Micrometer + Prometheus + Grafana; trazas con OpenTelemetry.
- Autorización por área a nivel de fila si se comparte una sola instancia por costo.
