package mx.nomina360.produccion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SolicitudRegistro(

        @NotNull(message = "el empleado es obligatorio")
        UUID empleadoId,

        @NotBlank(message = "el nombre del empleado es obligatorio")
        @Size(max = 200)
        String empleadoNombre,

        UUID centroTrabajoId,

        @NotNull(message = "el turno es obligatorio")
        UUID turnoId,

        @NotNull(message = "la fecha es obligatoria")
        LocalDate fecha,

        @NotNull(message = "las horas normales son obligatorias")
        @DecimalMin(value = "0.0", message = "las horas normales no pueden ser negativas")
        BigDecimal horasNormales,

        @DecimalMin(value = "0.0", message = "las horas extra no pueden ser negativas")
        BigDecimal horasExtra,

        @Size(max = 200)
        String observaciones) {
}
