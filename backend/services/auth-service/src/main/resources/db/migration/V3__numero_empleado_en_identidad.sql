alter table usuarios add column numero_empleado varchar(20);

update usuarios
set numero_empleado = case lower(email)
    when 'ana.lopez@nomina360.mx' then 'E-001'
    when 'luis.ramirez@nomina360.mx' then 'E-002'
    when 'marta.sanchez@nomina360.mx' then 'E-003'
    else numero_empleado
end;

create index idx_usuarios_numero_empleado on usuarios (numero_empleado);
