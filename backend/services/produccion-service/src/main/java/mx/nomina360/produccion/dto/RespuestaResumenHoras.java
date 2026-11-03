package mx.nomina360.produccion.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RespuestaResumenHoras(
        UUID empleadoId,
        LocalDate desde,
        LocalDate hasta,
        BigDecimal horasNormales,
        BigDecimal horasExtra,
        long registros,
        long aprobados) {
}
