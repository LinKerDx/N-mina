package mx.nomina360.auth.dto;
import mx.nomina360.auth.dominio.MensajeChat;
import java.time.Instant;
import java.util.UUID;
public record RespuestaChat(UUID id, UUID remitenteId, UUID destinatarioId, String contenido, Instant enviadoEn) {
    public static RespuestaChat desde(MensajeChat m) { return new RespuestaChat(m.getId(),m.getRemitenteId(),m.getDestinatarioId(),m.getContenido(),m.getEnviadoEn()); }
}
