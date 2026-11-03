package mx.nomina360.administracion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SolicitudPresupuesto(

        @NotNull(message = "el centro de costo es obligatorio")
        UUID centroCostoId,

        @NotNull(message = "el ejercicio es obligatorio")
        @Min(value = 2020, message = "ejercicio invalido")
        @Max(value = 2100, message = "ejercicio invalido")
        Integer ejercicio,

        @NotNull(message = "el mes es obligatorio")
        @Min(value = 1, message = "mes invalido")
        @Max(value = 12, message = "mes invalido")
        Integer mes,

        @NotNull(message = "el monto presupuestado es obligatorio")
        @DecimalMin(value = "0.00", message = "el monto no puede ser negativo")
        BigDecimal montoPresupuestado) {
}
