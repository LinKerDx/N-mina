# Decisiones de arquitectura (ADR)

Registro breve de las decisiones que más condicionan el sistema. Formato: contexto →
decisión → consecuencias.

---

## ADR-001 · Monorepo políglota con pnpm + Maven

**Contexto**: frontend TypeScript y backend Java comparten contratos, convenciones y ciclo de
entrega. Se quiere un solo PR y un solo pipeline.

**Decisión**: monorepo con `pnpm` + Turborepo para JS y un reactor Maven para Java. No hay
herramienta puente (Nx/Bazel): cada ecosistema usa su herramienta nativa y GitHub Actions los
orquesta.

**Consecuencias**: un clon = todo el sistema; cambios de contrato atómicos; CI puede saltarse
áreas por `paths`. A cambio, el repo crece y hay que cuidar el tiempo de build (cache de turbo,
`-pl` en Maven).

---

## ADR-002 · Spring Boot MVC (servlet) y no WebFlux en los servicios de dominio

**Contexto**: el negocio es CRUD + cálculo transaccional con JPA. La carga esperada es de
cientos de peticiones por minuto, no de millones.

**Decisión**: `spring-boot-starter-web` para auth/RH/producción/administración; **sólo** el
gateway usa WebFlux (Spring Cloud Gateway es reactivo).

**Consecuencias**: bloqueo por hilo y pools de conexión (predecible y fácil de depurar) a
cambio de menor throughput máximo, que no es el cuello de botella aquí. El equipo no necesita
pensar en reactividad para la lógica de nómina.

---

## ADR-003 · Una instancia PostgreSQL por área

**Contexto**: el requisito explícito es que cada área tenga su propia base, con dueños y
respaldos independientes. También se quiere evitar que un reporte de un área bloquee a otra.

**Decisión**: cuatro contenedores PostgreSQL (`db-auth`, `db-rh`, `db-produccion`, `db-admin`)
con usuario, volumen y respaldo propios. Sin acceso cruzado ni FKs entre bases.

**Consecuencias**: aislamiento real, fallos y restauraciones por área, respaldos granulares.
Coste: más contenedores y consultas distribuidas imposibles (se resuelven con APIs o eventos).
En un entorno gestionado se puede sustituir por 4 bases en una instancia con roles separados,
pero se pierde el aislamiento de recursos y de credenciales.

---

## ADR-004 · Maven multi-módulo (y no Gradle ni repos separados)

**Contexto**: 3 librerías compartidas y 5 servicios; se necesita construir sólo un servicio y
sus dependencias.

**Decisión**: reactor Maven con `dependencyManagement` centralizado (BOM de Spring Boot +
Spring Cloud) y `-pl <servicio> -am` para builds parciales. Una sola imagen Docker
parametrizada por `SERVICE`.

**Consecuencias**: versiones alineadas, sin duplicar POMs; Maven es más lento que Gradle pero
suficiente y universal en equipos Java. El `Dockerfile` único evita 5 copias divergentes.

---

## ADR-005 · JWT validado en el gateway y también en cada servicio

**Contexto**: el gateway es el punto de entrada, pero los servicios son accesibles dentro de la
red. Confiar sólo en el gateway deja la seguridad a merced de la topología de red.

**Decisión**: el gateway valida firma/expiración y propaga `X-User-*`; cada servicio vuelve a
validar el token con `common-security` (defensa en profundidad). Los `X-User-*` se usan sólo
para trazabilidad, nunca para autorizar.

**Consecuencias**: doble validación (coste negligible) y seguridad que no depende del
networking. Si mañana se añade mTLS o service mesh, la lógica de autorización no cambia.

---

## ADR-006 · Sesión stateless con refresh opaco y rotativo

**Contexto**: SPA + múltiples servicios; se quiere escalar horizontalmente sin sesiones
pegajosas, y revocar accesos sin esperar a que expire el access token.

**Decisión**: access token JWT de 30 min; refresh token opaco de 32 bytes almacenado como hash
SHA-256, rotado en cada uso y revocado en logout. Contraseñas BCrypt (coste 12).

**Consecuencias**: revocación efectiva vía refresh; el access token robado vive como máximo 30
min. Coste: una escritura por refresh y la necesidad de limpiar tokens expirados (job diario).

---

## ADR-007 · Flyway con `ddl-auto: validate`

**Contexto**: el esquema es un contrato entre áreas y la base es el activo más delicado.

**Decisión**: migraciones SQL versionadas por servicio; Hibernate sólo valida. Nada de
`update` automático en ningún ambiente.

**Consecuencias**: cambios revisables en PR, esquema reproducible y detección temprana de
desalineación entidad/tabla. Coste: cada cambio de entidad requiere migración explícita.

---

## ADR-008 · RabbitMQ + patrón outbox para Producción → RH

**Contexto**: aprobar horas no puede depender de que RH esté arriba, y un reintento no debe
duplicar incidencias.

**Decisión**: evento guardado en `evento_outbox` en la misma transacción del cambio de estado;
publicador programado; consumidor idempotente por `eventoId`; cola con dead-letter y reintentos.

**Consecuencias**: no se pierden eventos aunque el broker caiga; duplicados inofensivos.
Coste: un scheduler y una tabla más, y la necesidad de vigilar pendientes (`intentos > 0`).
Alternativa descartada: llamada HTTP síncrona con reintentos (acopla disponibilidad y puede
duplicar incidencias).

---

## ADR-009 · Motor de nómina como componente puro

**Contexto**: el cálculo es la parte más sensible; debe poder probarse sin base de datos y
auditarse.

**Decisión**: `CalculadoraNomina` recibe empleado, periodo, incidencias, tarifas y parámetros;
devuelve conceptos y totales. Sin repositorios, sin `@Transactional`, sin HTTP.

**Consecuencias**: tests rápidos y deterministas con valores calculados a mano; el servicio sólo
orquesta persistencia. Coste: hay que cargar las tablas antes de invocar y mantener el contrato
del resultado.

---

## ADR-010 · Screaming Architecture y paquetes compartidos

**Contexto**: el frontend crecerá (portal del empleado, reportes) y el login debía verse
profesional.

**Decisión**: `features/<dominio>/` con `api`, `components`, `pages`, `model`; paquetes
`@nomina360/core` (tipos, HTTP, formato, zod) y `@nomina360/ui` (design system). Sin importar
entre features.

**Consecuencias**: navegar el código es navegar el negocio; el design system se reutiliza. Coste:
disciplina para no crear dependencias cruzadas y mantenimiento de los tipos compartidos.

---

## ADR-011 · Tailwind 3.4 y anime.js 3

**Contexto**: se pidió Tailwind y anime.js; había que elegir versiones estables.

**Decisión**: Tailwind 3.4 (configuración JS clásica y ecosistema maduro) y anime.js 3
(`anime.timeline`, `stagger`, `random`), en lugar de Tailwind 4 (CSS-first, migración) y
anime.js 4 (API nueva).

**Consecuencias**: documentación abundante y menos sorpresas; migrar luego es acotado. La
animación está aislada en `features/auth/animaciones/login.ts` para que el cambio de versión no
toque la página.

---

## ADR-012 · Respaldos: pgBackRest + dumps cifrados + simulacro

**Contexto**: nómina es crítica y auditables sus datos personales; un dump diario deja 24 h de
pérdida y no se prueba nunca.

**Decisión**: PITR con pgBackRest a S3 con Object Lock (capa 1), dumps lógicos diarios cifrados
(capa 2), snapshots semanales (capa 3), export inmutable (capa 4) y simulacro automatizado
semanal que restaura y valida tablas.

**Consecuencias**: RPO de minutos y confianza real en el respaldo. Coste: configuración de
pgBackRest por instancia y disciplina de simulacros. Detalle en `docs/RESPALDOS.md`.

---

## ADR-013 · Imagen Docker única parametrizada

**Contexto**: cinco servicios con el mismo runtime y el mismo POM padre.

**Decisión**: `backend/Dockerfile` multi-stage con `ARG SERVICE`; el build usa `-pl` para
compilar sólo el servicio y sus dependencias.

**Consecuencias**: un solo lugar que mantener; imágenes reproducibles con el mismo JDK. Coste:
el contexto de build es el repo completo (mitigado con `.dockerignore` y cache de capas).

---

## ADR-014 · GitHub Actions para CI, imágenes y respaldos

**Contexto**: sin infraestructura de CI propia; se quiere trazabilidad y automatización.

**Decisión**: workflows separados por área con filtros `paths`, cache de Maven/pnpm, publicación
en GHCR al etiquetar y respaldos en un runner *self-hosted* dentro de la red privada.

**Consecuencias**: PRs verificados y releases con un tag. Coste: los respaldos no pueden correr
en runners de GitHub (no alcanzan bases privadas) y requieren mantener ese runner.

---

## Pendientes conscientes

| Tema | Estado | Cuándo abordarlo |
| --- | --- | --- |
| Tarifas fiscales oficiales por ejercicio | Datos demo 2025 | Antes de operar nómina real |
| CFDI de nómina y dispersión bancaria | Fuera de alcance | Integración con PAC/banco |
| Testcontainers para repositorios | Sólo unitarios | Al añadir integraciones |
| Cliente TypeScript generado desde OpenAPI | Tipos manuales | Al crecer el contrato |
| Rate limiting en login | Pendiente | Antes de exponer a internet |
| Trazas distribuidas (OpenTelemetry) | No implementado | Al operar en producción |
