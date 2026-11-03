package mx.nomina360.rh.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SolicitudIncidencia(

        @NotNull(message = "el empleado es obligatorio")
        UUID empleadoId,

        @NotBlank(message = "el tipo es obligatorio")
        @Pattern(regexp = "FALTA|RETARDO|HORAS_EXTRA|VACACIONES|INCAPACIDAD|PERMISO|BONO_PRODUCTIVIDAD",
                message = "tipo de incidencia invalido")
        String tipo,

        @NotNull(message = "la fecha es obligatoria")
        LocalDate fecha,

        @NotNull(message = "la cantidad es obligatoria")
        @DecimalMin(value = "0.01", message = "la cantidad debe ser mayor a cero")
        BigDecimal cantidad,

        @Size(max = 200)
        String motivo) {
}
