-- produccion_db: centros de trabajo, turnos, registros de horas y outbox.
-- Propiedad exclusiva de produccion-service.

create table centros_trabajo (
    id               uuid primary key,
    codigo           varchar(20)  not null unique,
    nombre           varchar(120) not null,
    capacidad_diaria integer      not null default 10,
    activo           boolean      not null default true
);

create table turnos (
    id          uuid primary key,
    nombre      varchar(80)  not null unique,
    hora_inicio time(6)      not null,
    hora_fin    time(6)      not null,
    horas       numeric(5, 2) not null
);

create table registros_horas (
    id                uuid primary key,
    empleado_id       uuid          not null,
    empleado_nombre   varchar(200)  not null,
    centro_trabajo_id uuid references centros_trabajo (id),
    turno_id          uuid          not null references turnos (id),
    fecha             date          not null,
    horas_normales    numeric(5, 2) not null default 0,
    horas_extra       numeric(5, 2) not null default 0,
    estatus           varchar(20)   not null default 'REGISTRADO',
    aprobado_por      varchar(160),
    aprobado_en       timestamptz,
    observaciones     varchar(200),
    creado_en         timestamptz   not null default now(),
    constraint uq_registro_empleado_fecha_turno unique (empleado_id, fecha, turno_id),
    constraint chk_registro_estatus check (estatus in ('REGISTRADO', 'APROBADO', 'RECHAZADO')),
    constraint chk_registro_horas check (horas_normales >= 0 and horas_extra >= 0)
);

create index idx_registros_fecha on registros_horas (fecha);
create index idx_registros_empleado on registros_horas (empleado_id, fecha);

-- Patron outbox: eventos de dominio pendientes de publicar a RabbitMQ
create table evento_outbox (
    id           uuid primary key,
    tipo         varchar(80)   not null,
    payload      varchar(4000) not null,
    creado_en    timestamptz   not null default now(),
    publicado_en timestamptz,
    intentos     integer       not null default 0
);

create index idx_outbox_pendientes on evento_outbox (creado_en) where publicado_en is null;

insert into centros_trabajo (id, codigo, nombre, capacidad_diaria) values
    ('66666666-0000-0000-0000-000000000001', 'CT-L1', 'Linea de produccion 1', 25),
    ('66666666-0000-0000-0000-000000000002', 'CT-L2', 'Linea de produccion 2', 20),
    ('66666666-0000-0000-0000-000000000003', 'CT-ALM', 'Almacen de producto terminado', 8);

insert into turnos (id, nombre, hora_inicio, hora_fin, horas) values
    ('77777777-0000-0000-0000-000000000001', 'Matutino', '06:00', '14:00', 8.00),
    ('77777777-0000-0000-0000-000000000002', 'Vespertino', '14:00', '22:00', 8.00),
    ('77777777-0000-0000-0000-000000000003', 'Nocturno', '22:00', '06:00', 8.00);

insert into registros_horas (id, empleado_id, empleado_nombre, centro_trabajo_id, turno_id,
                             fecha, horas_normales, horas_extra, estatus, aprobado_por, aprobado_en) values
    ('88888888-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Ana Lopez Garcia',
     '66666666-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001',
     '2026-01-08', 8.00, 2.00, 'REGISTRADO', null, null),
    ('88888888-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000008', 'Diego Paredes Mora',
     '66666666-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000001',
     '2026-01-08', 8.00, 0.00, 'REGISTRADO', null, null),
    ('88888888-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000004', 'Jorge Torres Diaz',
     '66666666-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000002',
     '2026-01-08', 8.00, 1.50, 'APROBADO', 'produccion@nomina360.mx', '2026-01-09 09:30:00+00'),
    ('88888888-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000001', 'Ana Lopez Garcia',
     '66666666-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001',
     '2026-01-09', 8.00, 3.00, 'APROBADO', 'produccion@nomina360.mx', '2026-01-09 18:05:00+00');
