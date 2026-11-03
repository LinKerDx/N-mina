package mx.nomina360.rh.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Acumulados del empleado para la cabecera de su portal.
 */
public record MiResumenNomina(
        long totalRecibos,
        BigDecimal totalPercepciones,
        BigDecimal totalDeducciones,
        BigDecimal totalNeto,
        BigDecimal ultimoNeto,
        String ultimoPeriodo,
        LocalDate ultimaFechaPago) {
}
