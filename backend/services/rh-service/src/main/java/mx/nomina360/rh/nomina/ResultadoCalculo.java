package mx.nomina360.rh.nomina;

import java.math.BigDecimal;
import java.util.List;

/**
 * Resultado del motor para un empleado en un periodo.
 */
public record ResultadoCalculo(
        List<ConceptoCalculado> conceptos,
        BigDecimal totalPercepciones,
        BigDecimal totalDeducciones,
        BigDecimal neto,
        BigDecimal diasPagados,
        BigDecimal baseGravable) {

    public ResultadoCalculo {
        conceptos = List.copyOf(conceptos);
    }

    public static ResultadoCalculo vacio(BigDecimal diasPagados) {
        return new ResultadoCalculo(List.of(), BigDecimal.ZERO.setScale(2), BigDecimal.ZERO.setScale(2),
                BigDecimal.ZERO.setScale(2), diasPagados, BigDecimal.ZERO.setScale(2));
    }

    public boolean sinPago() {
        return totalPercepciones.signum() <= 0;
    }
}
