package mx.nomina360.produccion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record SolicitudEventoCalendario(
        @NotBlank @Size(max = 120) String titulo,
        @Size(max = 500) String descripcion,
        @NotNull LocalDate fechaInicio,
        @NotNull LocalDate fechaFin) {}
