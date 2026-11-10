create table eventos_calendario (
    id uuid primary key,
    titulo varchar(120) not null,
    descripcion varchar(500),
    fecha_inicio date not null,
    fecha_fin date not null,
    creado_por varchar(160) not null,
    creado_en timestamptz not null default now(),
    constraint chk_evento_calendario_fechas check (fecha_fin >= fecha_inicio)
);

create index idx_eventos_calendario_fechas on eventos_calendario (fecha_inicio, fecha_fin);
