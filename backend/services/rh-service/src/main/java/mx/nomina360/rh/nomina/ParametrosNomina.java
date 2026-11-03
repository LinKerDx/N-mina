package mx.nomina360.rh.nomina;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Parametros legales configurables (tabla parametros_nomina).
 *
 * @param umaDiaria             valor de la UMA
 * @param primaVacacional       porcentaje de prima vacacional (0.25 = 25%)
 * @param factorIntegracion     factor de integracion del SBC (1.0493 por defecto)
 * @param tasaIncapacidad       porcentaje del sueldo pagado como subsidio (0.60)
 * @param horasExtraDoblesSemana horas extra semanales pagadas al doble (9 por LFT)
 */
public record ParametrosNomina(
        BigDecimal umaDiaria,
        BigDecimal primaVacacional,
        BigDecimal factorIntegracion,
        BigDecimal tasaIncapacidad,
        BigDecimal horasExtraDoblesSemana) {

    public static ParametrosNomina porDefecto() {
        return new ParametrosNomina(
                new BigDecimal("108.57"),
                new BigDecimal("0.25"),
                new BigDecimal("1.0493"),
                new BigDecimal("0.60"),
                new BigDecimal("9"));
    }

    public static ParametrosNomina desde(Map<String, BigDecimal> valores) {
        ParametrosNomina base = porDefecto();
        return new ParametrosNomina(
                valor(valores, "uma_diaria", base.umaDiaria()),
                valor(valores, "prima_vacacional", base.primaVacacional()),
                valor(valores, "factor_integracion", base.factorIntegracion()),
                valor(valores, "tasa_incapacidad", base.tasaIncapacidad()),
                valor(valores, "horas_extra_dobles_semana", base.horasExtraDoblesSemana()));
    }

    private static BigDecimal valor(Map<String, BigDecimal> valores, String clave, BigDecimal porDefecto) {
        if (valores == null) {
            return porDefecto;
        }
        BigDecimal encontrado = valores.get(clave);
        return encontrado == null ? porDefecto : encontrado;
    }
}
