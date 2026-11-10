package mx.nomina360.produccion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import mx.nomina360.produccion.dominio.TipoMarcacion;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Contrato normalizado entre los adaptadores de checador y Produccion. */
public record SolicitudMarcacion(
        @NotNull UUID empleadoId,
        @NotBlank @Size(max = 200) String empleadoNombre,
        @NotNull TipoMarcacion tipo,
        @NotNull OffsetDateTime ocurridoEn,
        @NotBlank @Size(max = 100) String dispositivoId,
        @NotBlank @Size(max = 160) String eventoDispositivoId) {
}
