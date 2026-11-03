package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.Puesto;

import java.math.BigDecimal;
import java.util.UUID;

public record RespuestaPuesto(
        UUID id,
        String nombre,
        UUID departamentoId,
        BigDecimal salarioBaseDiario,
        Integer nivel,
        boolean activo) {

    public static RespuestaPuesto desde(Puesto puesto) {
        return new RespuestaPuesto(puesto.getId(), puesto.getNombre(), puesto.getDepartamentoId(),
                puesto.getSalarioBaseDiario(), puesto.getNivel(), Boolean.TRUE.equals(puesto.getActivo()));
    }
}
