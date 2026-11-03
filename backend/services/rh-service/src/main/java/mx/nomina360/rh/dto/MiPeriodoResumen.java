package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.PeriodoNomina;

import java.time.LocalDate;
import java.util.UUID;

public record MiPeriodoResumen(
        UUID id,
        String nombre,
        String tipo,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        LocalDate fechaPago) {

    public static MiPeriodoResumen desde(PeriodoNomina periodo) {
        if (periodo == null) {
            return null;
        }
        return new MiPeriodoResumen(periodo.getId(), periodo.getNombre(), periodo.getTipo(),
                periodo.getFechaInicio(), periodo.getFechaFin(), periodo.getFechaPago());
    }
}
