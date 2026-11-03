-- Habilita el portal de autoservicio del empleado.
alter table usuarios drop constraint chk_usuarios_rol;

alter table usuarios
    add constraint chk_usuarios_rol
    check (rol in ('ADMIN', 'RH', 'PRODUCCION', 'ADMINISTRACION', 'EMPLEADO'));
