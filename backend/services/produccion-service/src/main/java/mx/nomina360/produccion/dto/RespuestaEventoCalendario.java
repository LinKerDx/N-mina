package mx.nomina360.produccion.dto;

import mx.nomina360.produccion.dominio.EventoCalendario;
import java.time.LocalDate;
import java.util.UUID;

public record RespuestaEventoCalendario(UUID id, String titulo, String descripcion,
        LocalDate fechaInicio, LocalDate fechaFin, String creadoPor) {
    public static RespuestaEventoCalendario desde(EventoCalendario e) {
        return new RespuestaEventoCalendario(e.getId(), e.getTitulo(), e.getDescripcion(),
                e.getFechaInicio(), e.getFechaFin(), e.getCreadoPor());
    }
}
