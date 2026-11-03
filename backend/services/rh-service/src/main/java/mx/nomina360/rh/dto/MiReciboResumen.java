package mx.nomina360.rh.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Fila del historial de recibos del empleado.
 */
public record MiReciboResumen(
        UUID id,
        MiPeriodoResumen periodo,
        BigDecimal diasPagados,
        BigDecimal totalPercepciones,
        BigDecimal totalDeducciones,
        BigDecimal neto,
        String estatus,
        Instant calculadoEn) {
}
