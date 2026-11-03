package mx.nomina360.rh.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RespuestaRecibo(
        UUID id,
        UUID empleadoId,
        String numeroEmpleado,
        String nombreEmpleado,
        BigDecimal diasPagados,
        BigDecimal totalPercepciones,
        BigDecimal totalDeducciones,
        BigDecimal neto,
        String estatus,
        List<RespuestaConcepto> conceptos) {
}
