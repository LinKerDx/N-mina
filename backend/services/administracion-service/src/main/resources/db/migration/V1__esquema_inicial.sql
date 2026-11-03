-- admin_db: centros de costo, presupuestos, proveedores y pagos.
-- Propiedad exclusiva de administracion-service.

create table centros_costo (
    id     uuid primary key,
    codigo varchar(20)  not null unique,
    nombre varchar(120) not null,
    area   varchar(40)  not null,
    activo boolean      not null default true
);

create table presupuestos (
    id                  uuid primary key,
    centro_costo_id     uuid           not null references centros_costo (id),
    ejercicio           integer        not null,
    mes                 integer        not null,
    monto_presupuestado numeric(14, 2) not null,
    monto_ejercido      numeric(14, 2) not null default 0,
    constraint uq_presupuesto_centro_mes unique (centro_costo_id, ejercicio, mes),
    constraint chk_presupuesto_mes check (mes between 1 and 12),
    constraint chk_presupuesto_montos check (monto_presupuestado >= 0 and monto_ejercido >= 0)
);

create index idx_presupuestos_ejercicio on presupuestos (ejercicio);

create table proveedores (
    id           uuid primary key,
    rfc          varchar(13)  not null unique,
    razon_social varchar(200) not null,
    email        varchar(160),
    activo       boolean      not null default true
);

create table pagos (
    id                 uuid primary key,
    folio              varchar(30)    not null unique,
    tipo               varchar(20)    not null,
    referencia_externa varchar(80),
    proveedor_id       uuid references proveedores (id),
    centro_costo_id    uuid           not null references centros_costo (id),
    periodo_nomina_id  uuid,
    monto              numeric(14, 2) not null,
    moneda             varchar(3)     not null default 'MXN',
    fecha_pago         date           not null,
    estatus            varchar(20)    not null default 'PAGADO',
    creado_en          timestamptz    not null default now(),
    constraint chk_pagos_tipo check (tipo in ('NOMINA', 'PROVEEDOR', 'IMPUESTO')),
    constraint chk_pagos_estatus check (estatus in ('PROGRAMADO', 'PAGADO', 'CANCELADO')),
    constraint chk_pagos_monto check (monto > 0)
);

create index idx_pagos_fecha on pagos (fecha_pago);
create index idx_pagos_centro on pagos (centro_costo_id);

insert into centros_costo (id, codigo, nombre, area) values
    ('99999999-0000-0000-0000-000000000001', 'CC-PROD-01', 'Produccion', 'Produccion'),
    ('99999999-0000-0000-0000-000000000002', 'CC-ADMIN-01', 'Administracion', 'Administracion'),
    ('99999999-0000-0000-0000-000000000003', 'CC-RH-01', 'Recursos Humanos', 'Recursos Humanos');

insert into presupuestos (id, centro_costo_id, ejercicio, mes, monto_presupuestado, monto_ejercido) values
    ('aaaaaaaa-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 2026, 1, 850000.00, 620000.00),
    ('aaaaaaaa-0000-0000-0000-000000000002', '99999999-0000-0000-0000-000000000001', 2026, 2, 850000.00, 0.00),
    ('aaaaaaaa-0000-0000-0000-000000000003', '99999999-0000-0000-0000-000000000002', 2026, 1, 320000.00, 45000.00),
    ('aaaaaaaa-0000-0000-0000-000000000004', '99999999-0000-0000-0000-000000000002', 2026, 2, 320000.00, 0.00),
    ('aaaaaaaa-0000-0000-0000-000000000005', '99999999-0000-0000-0000-000000000003', 2026, 1, 540000.00, 0.00),
    ('aaaaaaaa-0000-0000-0000-000000000006', '99999999-0000-0000-0000-000000000003', 2026, 2, 540000.00, 0.00);

insert into proveedores (id, rfc, razon_social, email) values
    ('bbbbbbbb-0000-0000-0000-000000000001', 'PRO010101AB1', 'Suministros Industriales del Norte',
     'contacto@suministrosnorte.mx'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'SER020202CD2', 'Servicios Contables Integrales',
     'facturas@servicioscontables.mx');

insert into pagos (id, folio, tipo, referencia_externa, proveedor_id, centro_costo_id, monto, fecha_pago) values
    ('cccccccc-0000-0000-0000-000000000001', 'PAG-2026-000101', 'NOMINA', 'periodo-dic-2025',
     null, '99999999-0000-0000-0000-000000000001', 620000.00, '2026-01-05'),
    ('cccccccc-0000-0000-0000-000000000002', 'PAG-2026-000102', 'PROVEEDOR', 'factura-A-2045',
     'bbbbbbbb-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000002', 45000.00, '2026-01-15');
