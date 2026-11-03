package mx.nomina360.rh.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * KPIs de RH para el tablero.
 */
public record RespuestaResumenGeneral(
        long empleadosActivos,
        long periodosAbiertos,
        UUID periodoRecienteId,
        String periodoReciente,
        String estatusPeriodoReciente,
        BigDecimal netoPeriodoReciente,
        long recibosPeriodoReciente) {
}
