package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.PeriodoNomina;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RespuestaPeriodo(
        UUID id,
        String nombre,
        String tipo,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        LocalDate fechaPago,
        Integer diasPeriodo,
        String estatus,
        Instant calculadoEn) {

    public static RespuestaPeriodo desde(PeriodoNomina periodo) {
        return new RespuestaPeriodo(periodo.getId(), periodo.getNombre(), periodo.getTipo(),
                periodo.getFechaInicio(), periodo.getFechaFin(), periodo.getFechaPago(),
                periodo.getDiasPeriodo(), periodo.getEstatus(), periodo.getCalculadoEn());
    }
}
