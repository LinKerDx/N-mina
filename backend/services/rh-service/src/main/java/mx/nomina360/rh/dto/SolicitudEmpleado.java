package mx.nomina360.rh.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SolicitudEmpleado(

        @NotBlank(message = "el numero de empleado es obligatorio")
        @Size(max = 20)
        String numeroEmpleado,

        @NotBlank(message = "el nombre es obligatorio")
        String nombre,

        @NotBlank(message = "el apellido paterno es obligatorio")
        String apellidoPaterno,

        String apellidoMaterno,

        @Size(min = 18, max = 18, message = "la CURP debe tener 18 caracteres")
        String curp,

        @Size(min = 12, max = 13, message = "el RFC debe tener 12 o 13 caracteres")
        String rfc,

        @Size(max = 15)
        String nss,

        @Email(message = "el correo no tiene un formato valido")
        String email,

        String telefono,

        UUID departamentoId,

        UUID puestoId,

        @Pattern(regexp = "INDEFINIDO|TEMPORAL|HONORARIOS|PRACTICAS", message = "tipo de contrato invalido")
        String tipoContrato,

        @NotNull(message = "la fecha de ingreso es obligatoria")
        LocalDate fechaIngreso,

        @NotNull(message = "el salario diario es obligatorio")
        @DecimalMin(value = "0.01", message = "el salario debe ser mayor a cero")
        BigDecimal salarioDiario,

        @Pattern(regexp = "ACTIVO|BAJA|VACACIONES|INCAPACIDAD", message = "estatus invalido")
        String estatus) {
}
