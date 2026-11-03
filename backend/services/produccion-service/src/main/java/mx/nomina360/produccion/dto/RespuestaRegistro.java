package mx.nomina360.produccion.dto;

import mx.nomina360.produccion.dominio.RegistroHoras;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RespuestaRegistro(
        UUID id,
        UUID empleadoId,
        String empleadoNombre,
        UUID centroTrabajoId,
        UUID turnoId,
        LocalDate fecha,
        BigDecimal horasNormales,
        BigDecimal horasExtra,
        String estatus,
        String aprobadoPor,
        Instant aprobadoEn,
        String observaciones) {

    public static RespuestaRegistro desde(RegistroHoras registro) {
        return new RespuestaRegistro(registro.getId(), registro.getEmpleadoId(), registro.getEmpleadoNombre(),
                registro.getCentroTrabajoId(), registro.getTurnoId(), registro.getFecha(),
                registro.getHorasNormales(), registro.getHorasExtra(), registro.getEstatus(),
                registro.getAprobadoPor(), registro.getAprobadoEn(), registro.getObservaciones());
    }
}
