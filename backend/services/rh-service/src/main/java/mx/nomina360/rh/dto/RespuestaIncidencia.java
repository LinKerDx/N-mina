package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.Incidencia;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RespuestaIncidencia(
        UUID id,
        UUID empleadoId,
        String tipo,
        LocalDate fecha,
        BigDecimal cantidad,
        String motivo,
        boolean autorizada,
        String origen,
        String referenciaExterna) {

    public static RespuestaIncidencia desde(Incidencia incidencia) {
        return new RespuestaIncidencia(incidencia.getId(), incidencia.getEmpleadoId(),
                incidencia.getTipo(), incidencia.getFecha(), incidencia.getCantidad(),
                incidencia.getMotivo(), Boolean.TRUE.equals(incidencia.getAutorizada()),
                incidencia.getOrigen(), incidencia.getReferenciaExterna());
    }
}
