-- rh_db: empleados, incidencias, periodos y resultados de nomina.
-- Propiedad exclusiva de rh-service (database-per-service).
--
-- NOTA FISCAL: las tarifas de ISR y cuotas del IMSS son valores de referencia
-- (tarifa mensual 2025). Antes de operar en produccion debes cargar las tablas
-- oficiales vigentes y validarlas con tu contador.

create table departamentos (
    id     uuid primary key,
    nombre varchar(120) not null unique,
    area   varchar(40)  not null,
    activo boolean      not null default true
);

create table puestos (
    id                  uuid primary key,
    nombre              varchar(120)   not null unique,
    departamento_id     uuid references departamentos (id),
    salario_base_diario numeric(12, 2) not null,
    nivel               integer        not null default 1,
    activo              boolean        not null default true
);

create table empleados (
    id               uuid primary key,
    numero_empleado  varchar(20)    not null unique,
    nombre           varchar(80)    not null,
    apellido_paterno varchar(80)    not null,
    apellido_materno varchar(80),
    curp             varchar(18),
    rfc              varchar(13),
    nss              varchar(15),
    email            varchar(160),
    telefono         varchar(20),
    departamento_id  uuid references departamentos (id),
    puesto_id        uuid references puestos (id),
    tipo_contrato    varchar(30)    not null default 'INDEFINIDO',
    fecha_ingreso    date           not null,
    fecha_baja       date,
    salario_diario   numeric(12, 2) not null,
    estatus          varchar(20)    not null default 'ACTIVO',
    creado_en        timestamptz    not null default now(),
    actualizado_en   timestamptz    not null default now(),
    constraint chk_empleados_estatus check (estatus in ('ACTIVO', 'BAJA', 'VACACIONES', 'INCAPACIDAD')),
    constraint chk_empleados_contrato check (tipo_contrato in ('INDEFINIDO', 'TEMPORAL', 'HONORARIOS', 'PRACTICAS')),
    constraint chk_empleados_salario check (salario_diario > 0)
);

create index idx_empleados_estatus on empleados (estatus);
create index idx_empleados_departamento on empleados (departamento_id);

create table periodos_nomina (
    id           uuid primary key,
    nombre       varchar(80) not null,
    tipo         varchar(20) not null,
    fecha_inicio date        not null,
    fecha_fin    date        not null,
    fecha_pago   date        not null,
    dias_periodo integer     not null,
    estatus      varchar(20) not null default 'BORRADOR',
    calculado_en timestamptz,
    creado_en    timestamptz not null default now(),
    constraint uq_periodos_tipo_inicio unique (tipo, fecha_inicio),
    constraint chk_periodos_tipo check (tipo in ('MENSUAL', 'QUINCENAL', 'CATORCENAL', 'SEMANAL')),
    constraint chk_periodos_estatus check (estatus in ('BORRADOR', 'CALCULADO', 'CERRADO')),
    constraint chk_periodos_fechas check (fecha_fin >= fecha_inicio)
);

create table recibos_nomina (
    id                 uuid primary key,
    periodo_id         uuid           not null references periodos_nomina (id) on delete cascade,
    empleado_id        uuid           not null references empleados (id),
    numero_empleado    varchar(20)    not null,
    nombre_empleado    varchar(200)   not null,
    dias_pagados       numeric(6, 2)  not null,
    total_percepciones numeric(14, 2) not null,
    total_deducciones  numeric(14, 2) not null,
    neto               numeric(14, 2) not null,
    estatus            varchar(20)    not null default 'CALCULADO',
    calculado_en       timestamptz    not null default now(),
    constraint uq_recibos_periodo_empleado unique (periodo_id, empleado_id)
);

create index idx_recibos_periodo on recibos_nomina (periodo_id);

create table conceptos_nomina (
    id          uuid primary key,
    recibo_id   uuid           not null references recibos_nomina (id) on delete cascade,
    tipo        varchar(15)    not null,
    clave       varchar(20)    not null,
    descripcion varchar(120)   not null,
    importe     numeric(14, 2) not null,
    gravable    boolean        not null default true,
    orden       integer        not null default 0,
    constraint chk_conceptos_tipo check (tipo in ('PERCEPCION', 'DEDUCCION'))
);

create index idx_conceptos_recibo on conceptos_nomina (recibo_id);

create table incidencias (
    id                  uuid primary key,
    empleado_id         uuid          not null references empleados (id) on delete cascade,
    tipo                varchar(30)   not null,
    fecha               date          not null,
    cantidad            numeric(8, 2) not null,
    motivo              varchar(200),
    autorizada          boolean       not null default true,
    origen              varchar(20)   not null default 'MANUAL',
    referencia_externa  varchar(80) unique,
    creado_en           timestamptz   not null default now(),
    constraint chk_incidencias_tipo check (tipo in
        ('FALTA', 'RETARDO', 'HORAS_EXTRA', 'VACACIONES', 'INCAPACIDAD', 'PERMISO', 'BONO_PRODUCTIVIDAD')),
    constraint chk_incidencias_cantidad check (cantidad > 0)
);

create index idx_incidencias_empleado_fecha on incidencias (empleado_id, fecha);

create table tarifas_isr (
    id              bigserial primary key,
    ejercicio       integer        not null,
    limite_inferior numeric(14, 2) not null,
    limite_superior numeric(14, 2),
    cuota_fija      numeric(14, 2) not null,
    tasa            numeric(6, 4)  not null
);

create index idx_tarifas_isr_ejercicio on tarifas_isr (ejercicio, limite_inferior);

create table cuotas_imss (
    id            bigserial primary key,
    concepto      varchar(40)  not null,
    tasa_obrera   numeric(6, 4) not null,
    vigente_desde date         not null,
    nota          varchar(200)
);

create table parametros_nomina (
    clave       varchar(60)    primary key,
    valor       numeric(14, 4) not null,
    descripcion varchar(200)   not null
);

create table eventos_procesados (
    id           varchar(80) primary key,
    origen       varchar(40) not null,
    procesado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Datos de demostracion
-- ---------------------------------------------------------------------------
insert into departamentos (id, nombre, area) values
    ('11111111-0000-0000-0000-000000000001', 'Produccion', 'Produccion'),
    ('11111111-0000-0000-0000-000000000002', 'Administracion', 'Administracion'),
    ('11111111-0000-0000-0000-000000000003', 'Recursos Humanos', 'Recursos Humanos'),
    ('11111111-0000-0000-0000-000000000004', 'Almacen', 'Produccion');

insert into puestos (id, nombre, departamento_id, salario_base_diario, nivel) values
    ('22222222-0000-0000-0000-000000000001', 'Operador de linea', '11111111-0000-0000-0000-000000000001', 450.00, 1),
    ('22222222-0000-0000-0000-000000000002', 'Supervisor de produccion', '11111111-0000-0000-0000-000000000001', 780.00, 3),
    ('22222222-0000-0000-0000-000000000003', 'Auxiliar administrativo', '11111111-0000-0000-0000-000000000002', 520.00, 1),
    ('22222222-0000-0000-0000-000000000004', 'Analista de RH', '11111111-0000-0000-0000-000000000003', 690.00, 2),
    ('22222222-0000-0000-0000-000000000005', 'Gerente de RH', '11111111-0000-0000-0000-000000000003', 1200.00, 4),
    ('22222222-0000-0000-0000-000000000006', 'Almacenista', '11111111-0000-0000-0000-000000000004', 410.00, 1);

insert into empleados (id, numero_empleado, nombre, apellido_paterno, apellido_materno, curp, rfc, nss,
                       email, departamento_id, puesto_id, tipo_contrato, fecha_ingreso, salario_diario, estatus) values
    ('33333333-0000-0000-0000-000000000001', 'E-001', 'Ana', 'Lopez', 'Garcia', 'LOGA930101MDFPRN01',
     'LOGA930101AB1', '12345678901', 'ana.lopez@nomina360.mx', '11111111-0000-0000-0000-000000000001',
     '22222222-0000-0000-0000-000000000001', 'INDEFINIDO', '2023-03-01', 450.00, 'ACTIVO'),
    ('33333333-0000-0000-0000-000000000002', 'E-002', 'Luis', 'Ramirez', 'Soto', 'RASL880215HDFMTS02',
     'RASL880215CD2', '12345678902', 'luis.ramirez@nomina360.mx', '11111111-0000-0000-0000-000000000001',
     '22222222-0000-0000-0000-000000000002', 'INDEFINIDO', '2022-07-15', 780.00, 'ACTIVO'),
    ('33333333-0000-0000-0000-000000000003', 'E-003', 'Marta', 'Sanchez', 'Ruiz', 'SARU950410MDFNRT03',
     'SARU950410EF3', '12345678903', 'marta.sanchez@nomina360.mx', '11111111-0000-0000-0000-000000000002',
     '22222222-0000-0000-0000-000000000003', 'INDEFINIDO', '2024-02-01', 520.00, 'ACTIVO'),
    ('33333333-0000-0000-0000-000000000004', 'E-004', 'Jorge', 'Torres', 'Diaz', 'TODJ990620HDFRRR04',
     'TODJ990620GH4', '12345678904', 'jorge.torres@nomina360.mx', '11111111-0000-0000-0000-000000000001',
     '22222222-0000-0000-0000-000000000001', 'TEMPORAL', '2025-11-15', 430.00, 'ACTIVO'),
    ('33333333-0000-0000-0000-000000000005', 'E-005', 'Carla', 'Mendez', 'Rios', 'MERI910801MDFNRS05',
     'MERI910801IJ5', '12345678905', 'carla.mendez@nomina360.mx', '11111111-0000-0000-0000-000000000003',
     '22222222-0000-0000-0000-000000000004', 'INDEFINIDO', '2023-09-04', 690.00, 'ACTIVO'),
    ('33333333-0000-0000-0000-000000000006', 'E-006', 'Raul', 'Flores', 'Nunez', 'FONR850123HDFLNL06',
     'FONR850123KL6', '12345678906', 'raul.flores@nomina360.mx', '11111111-0000-0000-0000-000000000003',
     '22222222-0000-0000-0000-000000000005', 'INDEFINIDO', '2021-01-11', 1200.00, 'ACTIVO'),
    ('33333333-0000-0000-0000-000000000007', 'E-007', 'Sofia', 'Castro', 'Leon', 'CALS970307MDFSTF07',
     'CALS970307MN7', '12345678907', 'sofia.castro@nomina360.mx', '11111111-0000-0000-0000-000000000004',
     '22222222-0000-0000-0000-000000000006', 'INDEFINIDO', '2025-06-16', 410.00, 'ACTIVO'),
    ('33333333-0000-0000-0000-000000000008', 'E-008', 'Diego', 'Paredes', 'Mora', 'PAMD960912HDFRRG08',
     'PAMD960912OP8', '12345678908', 'diego.paredes@nomina360.mx', '11111111-0000-0000-0000-000000000001',
     '22222222-0000-0000-0000-000000000001', 'INDEFINIDO', '2024-10-01', 455.00, 'ACTIVO');

insert into periodos_nomina (id, nombre, tipo, fecha_inicio, fecha_fin, fecha_pago, dias_periodo, estatus) values
    ('44444444-0000-0000-0000-000000000001', 'Diciembre 2025', 'MENSUAL', '2025-12-01', '2025-12-31', '2025-12-31', 31, 'BORRADOR'),
    ('44444444-0000-0000-0000-000000000002', 'Enero 2026', 'MENSUAL', '2026-01-01', '2026-01-31', '2026-01-31', 31, 'BORRADOR');

insert into incidencias (id, empleado_id, tipo, fecha, cantidad, motivo, origen) values
    ('55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'HORAS_EXTRA',
     '2026-01-09', 3.00, 'Cierre de linea de produccion', 'MANUAL'),
    ('55555555-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 'FALTA',
     '2026-01-20', 1.00, 'Falta justificada sin comprobante', 'MANUAL');

insert into tarifas_isr (ejercicio, limite_inferior, limite_superior, cuota_fija, tasa) values
    (2025, 0.01, 746.04, 0.00, 0.0192),
    (2025, 746.05, 6332.05, 14.32, 0.0640),
    (2025, 6332.06, 11128.01, 371.83, 0.1088),
    (2025, 11128.02, 12935.82, 893.63, 0.1600),
    (2025, 12935.83, 15487.71, 1182.88, 0.1792),
    (2025, 15487.72, 18599.15, 1640.18, 0.2136),
    (2025, 18599.16, 37458.02, 2304.17, 0.2352),
    (2025, 37458.03, 59063.02, 6746.68, 0.3000),
    (2025, 59063.03, 185592.00, 13228.18, 0.3200),
    (2025, 185592.01, 374838.00, 53717.42, 0.3400),
    (2025, 374838.01, null, 118021.06, 0.3500);

insert into cuotas_imss (concepto, tasa_obrera, vigente_desde, nota) values
    ('PRESTACIONES_EN_DINERO', 0.0025, '2024-01-01', 'Cuota obrera sobre el SBC'),
    ('GASTOS_MEDICOS_PENSIONADOS', 0.00375, '2024-01-01', 'Cuota obrera sobre el SBC'),
    ('INVALIDEZ_Y_VIDA', 0.00625, '2024-01-01', 'Cuota obrera sobre el SBC'),
    ('CESANTIA_Y_VEJEZ', 0.01125, '2024-01-01', 'Cuota obrera sobre el SBC'),
    ('EXCEDENTE_3_UMA', 0.0040, '2024-01-01', 'Cuota obrera sobre el excedente de 3 UMA');

insert into parametros_nomina (clave, valor, descripcion) values
    ('uma_diaria', 108.5700, 'Unidad de Medida y Actualizacion (referencia)'),
    ('prima_vacacional', 0.2500, 'Prima vacacional (25% de los dias de vacaciones)'),
    ('factor_integracion', 1.0493, 'Factor de integracion del Salario Base de Cotizacion'),
    ('tasa_incapacidad', 0.6000, 'Subsidio por incapacidad temporal'),
    ('horas_extra_dobles_semana', 9.0000, 'Horas extra semanales pagadas al doble (LFT)'),
    ('salario_minimo_diario', 278.8000, 'Salario minimo general de referencia');
