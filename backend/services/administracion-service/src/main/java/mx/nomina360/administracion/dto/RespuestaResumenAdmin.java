package mx.nomina360.administracion.dto;

import java.math.BigDecimal;

public record RespuestaResumenAdmin(
        Integer ejercicio,
        BigDecimal totalPresupuestado,
        BigDecimal totalEjercido,
        BigDecimal disponible,
        long pagosDelMes,
        BigDecimal montoPagadoMes) {
}
