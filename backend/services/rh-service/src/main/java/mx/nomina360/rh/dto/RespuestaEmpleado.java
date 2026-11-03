package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.Empleado;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RespuestaEmpleado(
        UUID id,
        String numeroEmpleado,
        String nombre,
        String apellidoPaterno,
        String apellidoMaterno,
        String nombreCompleto,
        String curp,
        String rfc,
        String nss,
        String email,
        String telefono,
        UUID departamentoId,
        String departamentoNombre,
        UUID puestoId,
        String puestoNombre,
        String tipoContrato,
        LocalDate fechaIngreso,
        LocalDate fechaBaja,
        BigDecimal salarioDiario,
        String estatus) {

    public static RespuestaEmpleado desde(Empleado empleado, String departamento, String puesto) {
        return new RespuestaEmpleado(empleado.getId(), empleado.getNumeroEmpleado(), empleado.getNombre(),
                empleado.getApellidoPaterno(), empleado.getApellidoMaterno(), empleado.nombreCompleto(),
                empleado.getCurp(), empleado.getRfc(), empleado.getNss(), empleado.getEmail(),
                empleado.getTelefono(), empleado.getDepartamentoId(), departamento,
                empleado.getPuestoId(), puesto, empleado.getTipoContrato(),
                empleado.getFechaIngreso(), empleado.getFechaBaja(), empleado.getSalarioDiario(),
                empleado.getEstatus());
    }
}
