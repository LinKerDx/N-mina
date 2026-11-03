-- auth_db: usuarios y refresh tokens (propiedad exclusiva de auth-service)
create table usuarios (
    id              uuid primary key,
    email           varchar(160) not null unique,
    password_hash   varchar(100) not null,
    nombre_completo varchar(160) not null,
    rol             varchar(30)  not null,
    area            varchar(40)  not null,
    activo          boolean      not null default true,
    creado_en       timestamptz  not null default now(),
    actualizado_en  timestamptz  not null default now(),
    constraint chk_usuarios_rol check (rol in ('ADMIN', 'RH', 'PRODUCCION', 'ADMINISTRACION'))
);

create table refresh_tokens (
    id         uuid primary key,
    usuario_id uuid         not null references usuarios (id) on delete cascade,
    token_hash varchar(64)  not null unique,
    expira_en  timestamptz  not null,
    revocado   boolean      not null default false,
    creado_en  timestamptz  not null default now()
);

create index idx_refresh_tokens_usuario on refresh_tokens (usuario_id);
create index idx_refresh_tokens_expira on refresh_tokens (expira_en);
