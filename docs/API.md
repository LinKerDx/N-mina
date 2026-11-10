# API

Base local: `http://localhost:8080` (gateway). Todas las rutas exigen
`Authorization: Bearer <accessToken>` salvo las marcadas como públicas.

Contrato de error (todos los servicios):

```json
{
  "timestamp": "2026-01-31T15:04:05.123Z",
  "status": 422,
  "codigo": "PRESUPUESTO_EXCEDIDO",
  "mensaje": "El pago de 90000 excede el disponible de 80000",
  "ruta": "/api/administracion/pagos",
  "correlationId": "0f5a1c8e-...",
  "detalles": []
}
```

Códigos habituales: `DATOS_INVALIDOS` (400), `NO_AUTENTICADO` (401), `TOKEN_INVALIDO` (401),
`ACCESO_DENEGADO` (403), `RECURSO_NO_ENCONTRADO` (404), `CONFLICTO_ESTADO` (409),
`*_EXCEDIDO` / `*_INVALIDO` (422), `ERROR_INTERNO` (500).

---

## Autenticación (`auth-service`)

| Método | Ruta                | Rol         | Descripción                             |
| ------ | ------------------- | ----------- | --------------------------------------- |
| POST   | `/api/auth/login`   | público     | Devuelve access + refresh token         |
| POST   | `/api/auth/refresh` | público     | Rota el refresh y emite un access nuevo |
| POST   | `/api/auth/logout`  | autenticado | Revoca el refresh indicado (204)        |
| GET    | `/api/auth/me`      | autenticado | Perfil del usuario                      |

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"rh@nomina360.mx","password":"Nomina360!"}'
```

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "6m3...",
  "tokenType": "Bearer",
  "expiraEnSegundos": 1800,
  "usuario": {
    "id": "0b0a...",
    "email": "rh@nomina360.mx",
    "nombreCompleto": "Rosa Hernandez",
    "rol": "RH",
    "area": "Recursos Humanos"
  }
}
```

Claims del access token: `sub` (UUID), `email`, `rol`, `area`, `iss`, `iat`, `exp`.

---

## Recursos Humanos (`rh-service`)

| Método | Ruta                                                       | Rol                                   | Descripción                                              |
| ------ | ---------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| GET    | `/api/rh/empleados?q=&estatus=&page=0&size=20`             | ADMIN, RH                             | Búsqueda paginada                                        |
| GET    | `/api/rh/empleados/{id}`                                   | ADMIN, RH                             | Detalle                                                  |
| POST   | `/api/rh/empleados`                                        | ADMIN, RH                             | Alta (201)                                               |
| PUT    | `/api/rh/empleados/{id}`                                   | ADMIN, RH                             | Actualización                                            |
| DELETE | `/api/rh/empleados/{id}?fechaBaja=YYYY-MM-DD`              | ADMIN, RH                             | Baja lógica (204)                                        |
| POST   | `/api/rh/empleados/{id}/reingreso?fechaIngreso=YYYY-MM-DD` | ADMIN, RH                             | Reactiva con nueva fecha de ingreso                      |
| POST   | `/api/rh/empleados/{id}/revertir-baja`                     | ADMIN, RH                             | Revierte la baja y conserva la fecha de ingreso original |
| GET    | `/api/rh/empleados/activos`                                | ADMIN, RH, PRODUCCIÓN, ADMINISTRACIÓN | Catálogo mínimo                                          |
| GET    | `/api/rh/departamentos`                                    | ADMIN, RH                             | Catálogo                                                 |
| GET    | `/api/rh/puestos`                                          | ADMIN, RH                             | Catálogo                                                 |
| GET    | `/api/rh/periodos?page=0&size=12`                          | ADMIN, RH, ADMINISTRACIÓN             | Periodos (paginado)                                      |
| POST   | `/api/rh/periodos`                                         | ADMIN, RH                             | Crea periodo (201)                                       |
| POST   | `/api/rh/periodos/{id}/calcular`                           | ADMIN, RH                             | Calcula recibos                                          |
| POST   | `/api/rh/periodos/{id}/cerrar`                             | ADMIN, RH                             | Cierra periodo calculado                                 |
| GET    | `/api/rh/periodos/{id}/recibos`                            | ADMIN, RH                             | Recibos con conceptos                                    |
| GET    | `/api/rh/recibos/{id}/pdf`                                 | ADMIN, RH                             | Recibo en PDF con datos del trabajador y desglose        |
| POST   | `/api/rh/incidencias`                                      | ADMIN, RH                             | Registra incidencia (201)                                |
| GET    | `/api/rh/incidencias?empleadoId=&desde=&hasta=`            | ADMIN, RH                             | Lista incidencias                                        |
| GET    | `/api/rh/resumen`                                          | autenticado                           | KPIs del tablero                                         |
| GET    | `/api/rh/periodos/{id}/ajustes`                            | ADMIN, RH, ADMINISTRACIÓN             | Conceptos adicionales de un periodo                      |
| POST   | `/api/rh/periodos/{id}/ajustes`                            | ADMIN, RH, ADMINISTRACIÓN             | Agrega percepción o deducción (201)                      |
| DELETE | `/api/rh/ajustes/{id}`                                     | ADMIN, RH, ADMINISTRACIÓN             | Quita concepto de un periodo (204)                       |

Los ajustes admiten `PERCEPCION` o `DEDUCCION`, descripción, importe positivo y bandera `gravable`.
Solo se pueden modificar mientras el periodo esté en borrador; las percepciones gravables se
incluyen en la base de ISR. Las deducciones que dejen un neto negativo impiden el cálculo.

### Alta de empleado

```json
{
  "numeroEmpleado": "E-009",
  "nombre": "Lucía",
  "apellidoPaterno": "Herrera",
  "apellidoMaterno": "Cano",
  "curp": "HECL940712MDFRNC09",
  "rfc": "HECL940712QR9",
  "nss": "12345678909",
  "email": "lucia.herrera@nomina360.mx",
  "departamentoId": "11111111-0000-0000-0000-000000000001",
  "puestoId": "22222222-0000-0000-0000-000000000001",
  "tipoContrato": "INDEFINIDO",
  "fechaIngreso": "2026-02-01",
  "salarioDiario": 480.0
}
```

### Periodo y cálculo

```bash
TOKEN=... # accessToken

# 1. Crear periodo mensual
curl -s -X POST http://localhost:8080/api/rh/periodos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"nombre":"Febrero 2026","tipo":"MENSUAL","fechaInicio":"2026-02-01","fechaFin":"2026-02-28","fechaPago":"2026-02-28"}'

# 2. Calcular
curl -s -X POST http://localhost:8080/api/rh/periodos/<ID>/calcular \
  -H "Authorization: Bearer $TOKEN"

# 3. Recibos
curl -s http://localhost:8080/api/rh/periodos/<ID>/recibos \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta del cálculo:

```json
{
  "periodoId": "4444...",
  "nombrePeriodo": "Febrero 2026",
  "recibosGenerados": 8,
  "totalPercepciones": 127680.0,
  "totalDeducciones": 15843.27,
  "totalNeto": 111836.73
}
```

Recibo:

```json
{
  "id": "…",
  "empleadoId": "…",
  "numeroEmpleado": "E-001",
  "nombreEmpleado": "Ana Lopez Garcia",
  "diasPagados": 28.0,
  "totalPercepciones": 12600.0,
  "totalDeducciones": 1305.84,
  "neto": 11294.16,
  "estatus": "CALCULADO",
  "conceptos": [
    {
      "tipo": "PERCEPCION",
      "clave": "001",
      "descripcion": "Sueldo",
      "importe": 12600.0,
      "gravable": true
    },
    {
      "tipo": "PERCEPCION",
      "clave": "003",
      "descripcion": "Horas extra dobles",
      "importe": 157.5,
      "gravable": true
    },
    {
      "tipo": "DEDUCCION",
      "clave": "103",
      "descripcion": "ISR",
      "importe": 1197.29,
      "gravable": false
    },
    {
      "tipo": "DEDUCCION",
      "clave": "104",
      "descripcion": "Cuota obrera IMSS",
      "importe": 371.19,
      "gravable": false
    }
  ]
}
```

### Recibo en PDF

```bash
curl -s -OJ -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/rh/recibos/<RECIBO_ID>/pdf
```

Respuesta `200` con `Content-Type: application/pdf` y
`Content-Disposition: attachment; filename*=UTF-8''recibo-E-001-Enero-2026.pdf`.
El PDF incluye número de empleado, nombre, CURP, RFC, NSS, correo, teléfono,
departamento, puesto, tipo de contrato, fecha de ingreso, salario diario, estatus,
días pagados, periodo, las tablas de percepciones y deducciones con subtotales y el
neto a pagar. Sin token responde `401`.

### Incidencia

| tipo                 | `cantidad` significa |
| -------------------- | -------------------- |
| `FALTA`              | días                 |
| `RETARDO`            | minutos              |
| `HORAS_EXTRA`        | horas                |
| `VACACIONES`         | días                 |
| `INCAPACIDAD`        | días                 |
| `PERMISO`            | días                 |
| `BONO_PRODUCTIVIDAD` | importe en MXN       |

---

## Producción (`produccion-service`)

| Método | Ruta                                                         | Rol               | Descripción                                                      |
| ------ | ------------------------------------------------------------ | ----------------- | ---------------------------------------------------------------- |
| POST   | `/api/produccion/registros`                                  | ADMIN, PRODUCCIÓN | Registra lote de horas (201)                                     |
| POST   | `/api/produccion/registros/{id}/aprobar`                     | ADMIN, PRODUCCIÓN | Aprueba y encola evento                                          |
| POST   | `/api/produccion/registros/{id}/rechazar?motivo=`            | ADMIN, PRODUCCIÓN | Rechaza                                                          |
| GET    | `/api/produccion/registros?fecha=&empleadoId=&desde=&hasta=` | ADMIN, PRODUCCIÓN | Consulta                                                         |
| GET    | `/api/produccion/resumen?empleadoId=&desde=&hasta=`          | ADMIN, PRODUCCIÓN | Totales de horas                                                 |
| GET    | `/api/produccion/centros-trabajo`                            | ADMIN, PRODUCCIÓN | Catálogo                                                         |
| GET    | `/api/produccion/turnos`                                     | ADMIN, PRODUCCIÓN | Catálogo                                                         |
| POST   | `/api/produccion/marcaciones`                                | ADMIN, PRODUCCIÓN | Recibe una marcación normalizada del conector del checador (201) |
| GET    | `/api/produccion/marcaciones?empleadoId=&desde=&hasta=`      | ADMIN, PRODUCCIÓN | Lista marcaciones por empleado e intervalo ISO-8601              |

### Preparación para reloj checador

La API normaliza cuatro eventos para que el resto del sistema no dependa de la marca del equipo:
`ENTRADA_TURNO`, `SALIDA_COMIDA`, `ENTRADA_COMIDA` y `SALIDA_TURNO`. Cada evento conserva el instante
con su zona horaria, el dispositivo y el identificador original del evento. Los reintentos del
conector son idempotentes por dispositivo e identificador de evento.

El checador no se conecta directamente a la API. Al elegir el equipo, un conector local traducirá
su protocolo, asociará su número de tarjeta con el `empleadoId` de Nómina360 y enviará este contrato
al gateway con credenciales de servicio. Por ahora la ruta está protegida con JWT y rol `ADMIN` o
`PRODUCCION`; no se debe guardar el JWT de un usuario en el dispositivo.

```json
{
  "empleadoId": "33333333-0000-0000-0000-000000000001",
  "empleadoNombre": "Ana Lopez Garcia",
  "tipo": "ENTRADA_TURNO",
  "ocurridoEn": "2026-11-10T07:00:00-06:00",
  "dispositivoId": "checador-planta-1",
  "eventoDispositivoId": "evento-original-987654"
}
```

```bash
curl -s -X POST http://localhost:8080/api/produccion/registros \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"registros":[{"empleadoId":"33333333-0000-0000-0000-000000000001","empleadoNombre":"Ana Lopez Garcia","centroTrabajoId":"66666666-0000-0000-0000-000000000001","turnoId":"77777777-0000-0000-0000-000000000001","fecha":"2026-02-03","horasNormales":8,"horasExtra":2,"observaciones":"Cierre de mes"}]}'
```

Al aprobar se publica `produccion.horas.aprobadas`:

```json
{
  "eventoId": "c2f3…",
  "empleadoId": "33333333-0000-0000-0000-000000000001",
  "fecha": "2026-02-03",
  "horasExtra": 2.0,
  "centroTrabajo": "Linea de produccion 1"
}
```

---

## Administración (`administracion-service`)

| Método | Ruta                                              | Rol                   | Descripción                 |
| ------ | ------------------------------------------------- | --------------------- | --------------------------- |
| GET    | `/api/administracion/centros-costo`               | ADMIN, ADMINISTRACIÓN | Catálogo                    |
| GET    | `/api/administracion/proveedores`                 | ADMIN, ADMINISTRACIÓN | Catálogo                    |
| GET    | `/api/administracion/presupuestos?ejercicio=2026` | ADMIN, ADMINISTRACIÓN | Presupuestos con % ejercido |
| POST   | `/api/administracion/presupuestos`                | ADMIN, ADMINISTRACIÓN | Define/actualiza monto      |
| GET    | `/api/administracion/pagos?desde=&hasta=`         | ADMIN, ADMINISTRACIÓN | Pagos                       |
| POST   | `/api/administracion/pagos`                       | ADMIN, ADMINISTRACIÓN | Registra pago (201)         |
| GET    | `/api/administracion/resumen?ejercicio=2026`      | ADMIN, ADMINISTRACIÓN | KPIs                        |

```bash
curl -s -X POST http://localhost:8080/api/administracion/pagos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"tipo":"NOMINA","centroCostoId":"99999999-0000-0000-0000-000000000001","periodoNominaId":"44444444-0000-0000-0000-000000000002","monto":620000,"fechaPago":"2026-01-31","referenciaExterna":"periodo-ene-2026"}'
```

Errores de negocio del módulo: `SIN_PRESUPUESTO`, `PRESUPUESTO_EXCEDIDO`,
`PRESUPUESTO_INSUFICIENTE`, `CENTRO_INEXISTENTE`, `PROVEEDOR_INEXISTENTE`.

---

## Portal del empleado (`rh-service`)

Requiere el rol `EMPLEADO`. La identidad se resuelve con el **correo del token** contra
`empleados.email` en `rh_db`; todas las consultas se filtran por ese empleado y un recibo de
otra persona responde `404` para no revelar su existencia.

| Método | Ruta                                 | Rol      | Descripción                          |
| ------ | ------------------------------------ | -------- | ------------------------------------ |
| GET    | `/api/rh/mi-nomina/perfil`           | EMPLEADO | Datos personales y laborales propios |
| GET    | `/api/rh/mi-nomina/resumen`          | EMPLEADO | Acumulados y último pago             |
| GET    | `/api/rh/mi-nomina/recibos`          | EMPLEADO | Historial de recibos propios         |
| GET    | `/api/rh/mi-nomina/recibos/{id}`     | EMPLEADO | Desglose del recibo propio           |
| GET    | `/api/rh/mi-nomina/recibos/{id}/pdf` | EMPLEADO | Recibo propio en PDF                 |

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana.lopez@nomina360.mx","password":"Nomina360!"}'

curl -s http://localhost:8080/api/rh/mi-nomina/recibos \
  -H "Authorization: Bearer $TOKEN"
```

```json
[
  {
    "id": "…",
    "periodo": {
      "id": "…",
      "nombre": "Enero 2026",
      "tipo": "MENSUAL",
      "fechaInicio": "2026-01-01",
      "fechaFin": "2026-01-31",
      "fechaPago": "2026-01-31"
    },
    "diasPagados": 31.0,
    "totalPercepciones": 14287.5,
    "totalDeducciones": 1755.26,
    "neto": 12532.24,
    "estatus": "CALCULADO",
    "calculadoEn": "2026-11-03T12:17:44Z"
  }
]
```

`GET /api/rh/mi-nomina/recibos/{id}` agrega `empleado` (perfil completo) y `conceptos`
(`tipo`, `clave`, `descripcion`, `importe`, `gravable`). El PDF usa el mismo generador del
recibo de RH, pero solo después de comprobar la propiedad del recibo.

---

## Operación

| Método | Ruta                                       | Descripción               |
| ------ | ------------------------------------------ | ------------------------- |
| GET    | `/actuator/health`                         | Salud (público)           |
| GET    | `/actuator/health/liveness` · `/readiness` | Probes                    |
| GET    | `/actuator/metrics`                        | Métricas                  |
| GET    | `/swagger-ui.html` · `/v3/api-docs`        | Documentación interactiva |

Cabeceras útiles: `X-Correlation-Id` (se propaga y se devuelve) y `Authorization`.
