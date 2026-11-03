package mx.nomina360.rh.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Desglose completo de un recibo para el empleado.
 */
public record MiReciboDetalle(
        UUID id,
        MiPeriodoResumen periodo,
        MiPerfilRespuesta empleado,
        BigDecimal diasPagados,
        BigDecimal totalPercepciones,
        BigDecimal totalDeducciones,
        BigDecimal neto,
        String estatus,
        Instant calculadoEn,
        List<RespuestaConcepto> conceptos) {

    public MiReciboDetalle {
        conceptos = List.copyOf(conceptos);
    }
}
