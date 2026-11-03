package mx.nomina360.rh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record SolicitudPeriodo(

        @NotBlank(message = "el nombre es obligatorio")
        String nombre,

        @NotBlank(message = "el tipo es obligatorio")
        @Pattern(regexp = "MENSUAL|QUINCENAL|CATORCENAL|SEMANAL", message = "tipo invalido")
        String tipo,

        @NotNull(message = "la fecha de inicio es obligatoria")
        LocalDate fechaInicio,

        @NotNull(message = "la fecha de fin es obligatoria")
        LocalDate fechaFin,

        @NotNull(message = "la fecha de pago es obligatoria")
        LocalDate fechaPago) {
}
