package mx.nomina360.rh.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record SolicitudAjusteNomina(
        @NotNull UUID empleadoId,
        @NotBlank @Pattern(regexp = "PERCEPCION|DEDUCCION") String tipo,
        @NotBlank @Size(max = 120) String descripcion,
        @NotNull @DecimalMin(value = "0.01") @DecimalMax(value = "999999999999.99") BigDecimal importe,
        @NotNull Boolean gravable) {
}
