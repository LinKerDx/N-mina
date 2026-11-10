create table mensajes_chat (
    id uuid primary key,
    remitente_id uuid not null references usuarios(id) on delete cascade,
    destinatario_id uuid not null references usuarios(id) on delete cascade,
    contenido varchar(2000) not null,
    enviado_en timestamptz not null default now(),
    constraint chk_chat_distintos check (remitente_id <> destinatario_id)
);
create index idx_chat_conversacion on mensajes_chat (remitente_id, destinatario_id, enviado_en);
