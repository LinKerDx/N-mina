package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.Empleado;

import java.util.UUID;

/**
 * Vista minima de empleado para catalogos de otras areas (produccion).
 */
public record RespuestaEmpleadoResumen(UUID id, String numeroEmpleado, String nombreCompleto) {

    public static RespuestaEmpleadoResumen desde(Empleado empleado) {
        return new RespuestaEmpleadoResumen(empleado.getId(), empleado.getNumeroEmpleado(),
                empleado.nombreCompleto());
    }
}
