alter table marcaciones_asistencia
    add column numero_empleado varchar(20);

create index idx_marcaciones_numero_fecha
    on marcaciones_asistencia (numero_empleado, ocurrido_en);
