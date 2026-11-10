package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.AjusteNomina;

import java.math.BigDecimal;
import java.util.UUID;

public record RespuestaAjusteNomina(
        UUID id,
        UUID periodoId,
        UUID empleadoId,
        String empleadoNombre,
        String tipo,
        String descripcion,
        BigDecimal importe,
        boolean gravable) {

    public static RespuestaAjusteNomina desde(AjusteNomina ajuste, String empleadoNombre) {
        return new RespuestaAjusteNomina(
                ajuste.getId(), ajuste.getPeriodoId(), ajuste.getEmpleadoId(), empleadoNombre,
                ajuste.getTipo(), ajuste.getDescripcion(), ajuste.getImporte(),
                Boolean.TRUE.equals(ajuste.getGravable()));
    }
}
