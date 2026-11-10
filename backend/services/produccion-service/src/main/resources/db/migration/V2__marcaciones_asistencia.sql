-- Eventos de asistencia normalizados para recibir datos de distintos checadores.
create table marcaciones_asistencia (
    id                    uuid primary key,
    empleado_id           uuid         not null,
    empleado_nombre       varchar(200) not null,
    tipo                  varchar(30)  not null,
    ocurrido_en           timestamptz  not null,
    origen                varchar(20)  not null,
    dispositivo_id        varchar(100),
    evento_dispositivo_id varchar(160),
    recibido_en           timestamptz  not null default now(),
    constraint chk_marcacion_tipo check (
        tipo in ('ENTRADA_TURNO', 'SALIDA_COMIDA', 'ENTRADA_COMIDA', 'SALIDA_TURNO')
    ),
    constraint chk_marcacion_origen check (origen in ('MANUAL', 'DISPOSITIVO')),
    constraint uq_marcacion_dispositivo_evento unique (dispositivo_id, evento_dispositivo_id)
);

create index idx_marcaciones_empleado_fecha
    on marcaciones_asistencia (empleado_id, ocurrido_en);
