package mx.nomina360.rh.nomina;

import java.math.BigDecimal;

/**
 * Concepto de nomina ya calculado (antes de persistirse).
 */
public record ConceptoCalculado(
        String tipo,
        String clave,
        String descripcion,
        BigDecimal importe,
        boolean gravable,
        int orden) {
}
