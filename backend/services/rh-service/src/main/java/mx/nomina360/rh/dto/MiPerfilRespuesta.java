package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.Empleado;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Datos del propio trabajador para su portal de autoservicio.
 */
public record MiPerfilRespuesta(
        UUID id,
        String numeroEmpleado,
        String nombreCompleto,
        String curp,
        String rfc,
        String nss,
        String email,
        String telefono,
        String departamento,
        String puesto,
        String tipoContrato,
        LocalDate fechaIngreso,
        BigDecimal salarioDiario,
        String estatus) {

    public static MiPerfilRespuesta desde(Empleado empleado, String departamento, String puesto) {
        return new MiPerfilRespuesta(empleado.getId(), empleado.getNumeroEmpleado(),
                empleado.nombreCompleto(), empleado.getCurp(), empleado.getRfc(), empleado.getNss(),
                empleado.getEmail(), empleado.getTelefono(), departamento, puesto,
                empleado.getTipoContrato(), empleado.getFechaIngreso(), empleado.getSalarioDiario(),
                empleado.getEstatus());
    }
}
