package mx.nomina360.auth.dominio;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mensajes_chat")
public class MensajeChat {
    @Id
    private UUID id;
    @Column(name = "remitente_id", nullable = false)
    private UUID remitenteId;
    @Column(name = "destinatario_id", nullable = false)
    private UUID destinatarioId;
    @Column(nullable = false, length = 2000)
    private String contenido;
    @Column(name = "enviado_en", nullable = false)
    private Instant enviadoEn;

    public MensajeChat() {}

    @PrePersist
    void crear() {
        if (id == null) id = UUID.randomUUID();
        if (enviadoEn == null) enviadoEn = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRemitenteId() { return remitenteId; }
    public void setRemitenteId(UUID remitenteId) { this.remitenteId = remitenteId; }
    public UUID getDestinatarioId() { return destinatarioId; }
    public void setDestinatarioId(UUID destinatarioId) { this.destinatarioId = destinatarioId; }
    public String getContenido() { return contenido; }
    public void setContenido(String contenido) { this.contenido = contenido; }
    public Instant getEnviadoEn() { return enviadoEn; }
}
