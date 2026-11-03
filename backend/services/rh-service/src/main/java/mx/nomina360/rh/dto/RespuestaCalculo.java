package mx.nomina360.rh.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RespuestaCalculo(
        UUID periodoId,
        String nombrePeriodo,
        int recibosGenerados,
        BigDecimal totalPercepciones,
        BigDecimal totalDeducciones,
        BigDecimal totalNeto) {
}
