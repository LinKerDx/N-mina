create table ajustes_nomina (
    id          uuid primary key,
    periodo_id  uuid          not null references periodos_nomina (id) on delete cascade,
    empleado_id uuid          not null references empleados (id),
    tipo        varchar(15)   not null,
    descripcion varchar(120)  not null,
    importe     numeric(14,2) not null,
    gravable    boolean       not null default false,
    creado_en   timestamptz   not null default now(),
    constraint chk_ajustes_tipo check (tipo in ('PERCEPCION', 'DEDUCCION')),
    constraint chk_ajustes_importe check (importe > 0),
    constraint chk_ajustes_gravable check (tipo = 'PERCEPCION' or gravable = false)
);

create index idx_ajustes_periodo on ajustes_nomina (periodo_id, creado_en);
create index idx_ajustes_empleado on ajustes_nomina (empleado_id, periodo_id);
