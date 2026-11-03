package mx.nomina360.administracion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SolicitudPago(

        @NotBlank(message = "el tipo de pago es obligatorio")
        @Pattern(regexp = "NOMINA|PROVEEDOR|IMPUESTO", message = "tipo de pago invalido")
        String tipo,

        String referenciaExterna,

        UUID proveedorId,

        @NotNull(message = "el centro de costo es obligatorio")
        UUID centroCostoId,

        UUID periodoNominaId,

        @NotNull(message = "el monto es obligatorio")
        @DecimalMin(value = "0.01", message = "el monto debe ser mayor a cero")
        BigDecimal monto,

        @Pattern(regexp = "MXN|USD", message = "moneda invalida")
        String moneda,

        @NotNull(message = "la fecha de pago es obligatoria")
        LocalDate fechaPago) {
}
