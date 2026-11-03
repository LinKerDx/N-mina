# Scripts de operación

Un solo CLI sin dependencias: [`nomina.mjs`](./nomina.mjs). Funciona en Windows, macOS y
Linux porque sólo usa Node 22+ y Docker.

```bash
node scripts/nomina.mjs <comando>
# o con los atajos de pnpm (prefijo nomina: para no chocar con comandos nativos)
pnpm nomina:up · pnpm nomina:dev · pnpm nomina:check · pnpm nomina:doctor
pnpm nomina:status · pnpm nomina:logs · pnpm nomina:down · pnpm nomina:backup
```

> `pnpm up` y `pnpm doctor` son comandos propios de pnpm (actualizar dependencias y
> diagnóstico de pnpm). Por eso los atajos llevan el prefijo `nomina:`.

| Comando | Qué hace | Cuándo usarlo |
| --- | --- | --- |
| `up` | Crea `.env` si falta, construye imágenes y levanta todo el stack, espera healthchecks y muestra URLs y usuarios | Primera ejecución y demo |
| `dev` | Levanta sólo PostgreSQL + RabbitMQ en Docker, arranca los 5 microservicios con Maven y Vite en local | Desarrollo diario con recarga |
| `check` | `mvn verify` + lint + typecheck + test + build | Antes de un PR |
| `doctor` | Verifica Node, pnpm, Docker, JDK 21–24, Maven y `.env` | Algo no arranca |
| `status` | `docker compose ps` | Saber qué está arriba |
| `logs [servicio]` | Sigue logs (`pnpm nomina:logs rh-service`) | Depurar |
| `down [--datos]` | Detiene el stack; `--datos` borra también los volúmenes | Limpiar |
| `backup` | Respaldo lógico cifrado de las 4 bases a S3 | Operación |

## Opciones

- `check --rapido` omite el build de producción (más rápido).
- `check --backend` o `--frontend` limitan el alcance.
- `dev --solo-infra` deja sólo las bases y RabbitMQ arriba.
- `down --datos` (o `-v`) elimina los datos de desarrollo.
- `NOMINA_MAVEN_REPO=./.m2repo` usa un repositorio Maven dentro del proyecto cuando `~/.m2`
  no es escribible (sandboxes, runners con HOME restringido).

## Qué hace `up` exactamente

1. Copia `.env.example` a `.env` con `JWT_SECRET` y passphrase de respaldo aleatorios.
2. Comprueba que el daemon de Docker responda (si no, te dice cómo arrancarlo).
3. `docker compose up --build -d`.
4. Espera `http://localhost:8080/actuator/health` y la web.
5. Imprime URLs, usuarios demo y comandos útiles.

## Qué hace `dev`

1. Crea `.env` si falta y levanta `db-auth`, `db-rh`, `db-produccion`, `db-admin` y `rabbitmq`.
2. Espera los puertos 5433–5436 y 5672.
3. Detecta un JDK 21–24 (`JAVA_HOME` o instalaciones típicas).
4. Lanza cada microservicio con `mvn spring-boot:run` en segundo plano, con logs en `./logs/<servicio>.log`.
5. Espera al gateway y arranca Vite en primer plano.
6. Al pulsar `Ctrl+C`, detiene también los microservicios.

Los PIDs quedan en `.dev-pids.json` (ignorado por Git). Si algo queda huérfano:
`node scripts/nomina.mjs down` y cierra las ventanas de Maven.
