package mx.nomina360.produccion.dto;

import mx.nomina360.produccion.dominio.Turno;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

public record RespuestaTurno(UUID id, String nombre, LocalTime horaInicio, LocalTime horaFin, BigDecimal horas) {

    public static RespuestaTurno desde(Turno turno) {
        return new RespuestaTurno(turno.getId(), turno.getNombre(), turno.getHoraInicio(),
                turno.getHoraFin(), turno.getHoras());
    }
}
