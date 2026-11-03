package mx.nomina360.administracion.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RespuestaPresupuesto(
        UUID id,
        UUID centroCostoId,
        String centroCostoNombre,
        Integer ejercicio,
        Integer mes,
        BigDecimal montoPresupuestado,
        BigDecimal montoEjercido,
        BigDecimal disponible,
        BigDecimal porcentajeEjercido) {
}
