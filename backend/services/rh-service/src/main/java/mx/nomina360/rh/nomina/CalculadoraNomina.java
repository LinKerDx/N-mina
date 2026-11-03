package mx.nomina360.rh.nomina;

import mx.nomina360.rh.dominio.CuotaImss;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.Incidencia;
import mx.nomina360.rh.dominio.PeriodoNomina;
import mx.nomina360.rh.dominio.TarifaIsr;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Motor de calculo de nomina (logica pura, sin acceso a datos).
 *
 * <p>Reglas implementadas:
 * <ul>
 *   <li>Sueldo integrado por dias activos dentro del periodo (prorrateo por ingreso/baja).</li>
 *   <li>Faltas e incapacidades se descuentan; la incapacidad recibe un subsidio del 60%.</li>
 *   <li>Horas extra: las primeras 9 de la semana al 200%, el resto al 300% (LFT).</li>
 *   <li>Prima vacacional configurable (25% por defecto).</li>
 *   <li>ISR con la tarifa mensual del ejercicio y prorrateo por dias del periodo.</li>
 *   <li>Cuotas obreras del IMSS sobre el Salario Base de Cotizacion (SBC).</li>
 * </ul>
 *
 * <p>Las tablas de ISR/IMSS son parametrizables: antes de operar en produccion deben
 * cargarse las tarifas oficiales vigentes y validarse con el area fiscal.
 */
@Component
public class CalculadoraNomina {

    public static final String TIPO_PERCEPCION = "PERCEPCION";
    public static final String TIPO_DEDUCCION = "DEDUCCION";

    private static final BigDecimal DIAS_MES = new BigDecimal("30");
    private static final BigDecimal HORAS_JORNADA = new BigDecimal("8");
    private static final BigDecimal DOS = new BigDecimal("2");
    private static final BigDecimal TRES = new BigDecimal("3");
    private static final BigDecimal TRES_UMAS = new BigDecimal("3");
    private static final BigDecimal CERO = BigDecimal.ZERO.setScale(2);

    public ResultadoCalculo calcular(Empleado empleado,
                                     PeriodoNomina periodo,
                                     List<Incidencia> incidencias,
                                     List<TarifaIsr> tarifas,
                                     List<CuotaImss> cuotas,
                                     ParametrosNomina parametros) {
        BigDecimal salarioDiario = escala(empleado.getSalarioDiario());
        BigDecimal diasActivos = diasActivosEnPeriodo(empleado, periodo);

        if (diasActivos.signum() <= 0 || salarioDiario.signum() <= 0) {
            return ResultadoCalculo.vacio(diasActivos);
        }

        BigDecimal faltas = limitar(suma(incidencias, TiposIncidencia.FALTA), diasActivos);
        BigDecimal diasIncapacidad = limitar(suma(incidencias, TiposIncidencia.INCAPACIDAD), diasActivos);
        BigDecimal diasVacaciones = limitar(suma(incidencias, TiposIncidencia.VACACIONES), diasActivos);
        BigDecimal horasExtra = suma(incidencias, TiposIncidencia.HORAS_EXTRA);
        BigDecimal bonos = suma(incidencias, TiposIncidencia.BONO_PRODUCTIVIDAD);

        List<ConceptoCalculado> conceptos = new ArrayList<>();
        int orden = 1;

        BigDecimal sueldo = multiplicar(salarioDiario, diasActivos);
        conceptos.add(new ConceptoCalculado(TIPO_PERCEPCION, "001", "Sueldo", sueldo, true, orden++));

        BigDecimal primaVacacional = multiplicar(
                multiplicar(salarioDiario, diasVacaciones), parametros.primaVacacional());
        if (primaVacacional.signum() > 0) {
            conceptos.add(new ConceptoCalculado(TIPO_PERCEPCION, "002", "Prima vacacional",
                    primaVacacional, true, orden++));
        }

        BigDecimal tarifaHora = salarioDiario.divide(HORAS_JORNADA, 6, RoundingMode.HALF_UP);
        BigDecimal horasDobles = horasExtra.min(parametros.horasExtraDoblesSemana());
        BigDecimal horasTriples = horasExtra.subtract(horasDobles).max(BigDecimal.ZERO);

        BigDecimal importeHorasDobles = CERO;
        if (horasDobles.signum() > 0) {
            importeHorasDobles = multiplicar(multiplicar(tarifaHora, horasDobles), DOS);
            conceptos.add(new ConceptoCalculado(TIPO_PERCEPCION, "003", "Horas extra dobles",
                    importeHorasDobles, true, orden++));
        }

        BigDecimal importeHorasTriples = CERO;
        if (horasTriples.signum() > 0) {
            importeHorasTriples = multiplicar(multiplicar(tarifaHora, horasTriples), TRES);
            conceptos.add(new ConceptoCalculado(TIPO_PERCEPCION, "004", "Horas extra triples",
                    importeHorasTriples, true, orden++));
        }

        BigDecimal subsidioIncapacidad = multiplicar(
                multiplicar(salarioDiario, diasIncapacidad), parametros.tasaIncapacidad());
        if (subsidioIncapacidad.signum() > 0) {
            conceptos.add(new ConceptoCalculado(TIPO_PERCEPCION, "005", "Subsidio por incapacidad",
                    subsidioIncapacidad, false, orden++));
        }

        if (bonos.signum() > 0) {
            conceptos.add(new ConceptoCalculado(TIPO_PERCEPCION, "006", "Bono de productividad",
                    escala(bonos), true, orden++));
        }

        BigDecimal descuentoFaltas = multiplicar(salarioDiario, faltas);
        if (descuentoFaltas.signum() > 0) {
            conceptos.add(new ConceptoCalculado(TIPO_DEDUCCION, "101", "Falta(s) sin goce",
                    descuentoFaltas, false, orden++));
        }

        BigDecimal descuentoIncapacidad = multiplicar(salarioDiario, diasIncapacidad);
        if (descuentoIncapacidad.signum() > 0) {
            conceptos.add(new ConceptoCalculado(TIPO_DEDUCCION, "102", "Incapacidad no pagada",
                    descuentoIncapacidad, false, orden++));
        }

        // La base gravable excluye los dias no laborados y el subsidio (exento).
        BigDecimal baseGravable = sueldo
                .add(primaVacacional)
                .add(importeHorasDobles)
                .add(importeHorasTriples)
                .add(escala(bonos))
                .subtract(descuentoFaltas)
                .subtract(descuentoIncapacidad)
                .max(BigDecimal.ZERO);

        BigDecimal isr = calcularIsr(baseGravable, periodo.getDiasPeriodo(), tarifas);
        if (isr.signum() > 0) {
            conceptos.add(new ConceptoCalculado(TIPO_DEDUCCION, "103", "ISR", isr, false, orden++));
        }

        BigDecimal imss = calcularImss(diasActivos, salarioDiario, cuotas, parametros);
        if (imss.signum() > 0) {
            conceptos.add(new ConceptoCalculado(TIPO_DEDUCCION, "104", "Cuota obrera IMSS",
                    imss, false, orden++));
        }

        BigDecimal totalPercepciones = sumarTipo(conceptos, TIPO_PERCEPCION);
        BigDecimal totalDeducciones = sumarTipo(conceptos, TIPO_DEDUCCION);

        return new ResultadoCalculo(
                conceptos,
                totalPercepciones,
                totalDeducciones,
                totalPercepciones.subtract(totalDeducciones),
                diasActivos.setScale(2, RoundingMode.HALF_UP),
                baseGravable.setScale(2, RoundingMode.HALF_UP));
    }

    /**
     * ISR mensual prorrateado a los dias del periodo. Si el ejercicio no tiene tarifa
     * cargada, el llamador debe enviar la ultima tarifa publicada.
     */
    public BigDecimal calcularIsr(BigDecimal baseGravable, int diasPeriodo, List<TarifaIsr> tarifas) {
        if (baseGravable == null || baseGravable.signum() <= 0 || diasPeriodo <= 0 || tarifas == null || tarifas.isEmpty()) {
            return CERO;
        }

        BigDecimal dias = BigDecimal.valueOf(diasPeriodo);
        BigDecimal baseMensual = baseGravable.multiply(DIAS_MES).divide(dias, 2, RoundingMode.HALF_UP);
        if (baseMensual.compareTo(new BigDecimal("0.01")) < 0) {
            return CERO;
        }

        TarifaIsr tramo = null;
        for (TarifaIsr candidato : tarifas) {
            boolean cumpleInferior = baseMensual.compareTo(candidato.getLimiteInferior()) >= 0;
            boolean cumpleSuperior = candidato.getLimiteSuperior() == null
                    || baseMensual.compareTo(candidato.getLimiteSuperior()) <= 0;
            if (cumpleInferior && cumpleSuperior) {
                tramo = candidato;
                break;
            }
        }
        if (tramo == null) {
            tramo = tarifas.get(tarifas.size() - 1);
        }

        BigDecimal excedente = baseMensual.subtract(tramo.getLimiteInferior()).max(BigDecimal.ZERO);
        BigDecimal isrMensual = tramo.getCuotaFija().add(excedente.multiply(tramo.getTasa()));
        BigDecimal isrPeriodo = isrMensual.multiply(dias).divide(DIAS_MES, 2, RoundingMode.HALF_UP);
        return isrPeriodo.max(BigDecimal.ZERO);
    }

    /**
     * Cuota obrera del IMSS: porcentaje sobre el SBC mas la cuota del excedente de 3 UMA.
     */
    public BigDecimal calcularImss(BigDecimal diasActivos, BigDecimal salarioDiario,
                                   List<CuotaImss> cuotas, ParametrosNomina parametros) {
        if (cuotas == null || cuotas.isEmpty() || diasActivos.signum() <= 0) {
            return CERO;
        }

        BigDecimal sbc = salarioDiario.multiply(parametros.factorIntegracion());
        BigDecimal limite = parametros.umaDiaria().multiply(TRES_UMAS);
        BigDecimal excedente = sbc.subtract(limite).max(BigDecimal.ZERO);

        BigDecimal total = BigDecimal.ZERO;
        for (CuotaImss cuota : cuotas) {
            BigDecimal base = cuota.getConcepto().startsWith("EXCEDENTE") ? excedente : sbc;
            BigDecimal importe = base.multiply(cuota.getTasaObrera()).multiply(diasActivos);
            total = total.add(importe.setScale(2, RoundingMode.HALF_UP));
        }
        return total;
    }

    public BigDecimal diasActivosEnPeriodo(Empleado empleado, PeriodoNomina periodo) {
        LocalDate desde = empleado.getFechaIngreso().isAfter(periodo.getFechaInicio())
                ? empleado.getFechaIngreso()
                : periodo.getFechaInicio();
        LocalDate hasta = empleado.getFechaBaja() != null && empleado.getFechaBaja().isBefore(periodo.getFechaFin())
                ? empleado.getFechaBaja()
                : periodo.getFechaFin();

        long dias = ChronoUnit.DAYS.between(desde, hasta) + 1;
        if (dias <= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        long limite = periodo.getDiasPeriodo() == null ? 30 : periodo.getDiasPeriodo();
        return BigDecimal.valueOf(Math.min(dias, limite)).setScale(2);
    }

    private static BigDecimal suma(List<Incidencia> incidencias, String tipo) {
        if (incidencias == null || incidencias.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return incidencias.stream()
                .filter(i -> tipo.equals(i.getTipo()))
                .filter(i -> Boolean.TRUE.equals(i.getAutorizada()))
                .map(Incidencia::getCantidad)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal limitar(BigDecimal valor, BigDecimal maximo) {
        BigDecimal acotado = valor.max(BigDecimal.ZERO);
        return acotado.min(maximo);
    }

    private static BigDecimal sumarTipo(List<ConceptoCalculado> conceptos, String tipo) {
        return conceptos.stream()
                .filter(c -> tipo.equals(c.tipo()))
                .map(ConceptoCalculado::importe)
                .reduce(CERO, BigDecimal::add);
    }

    private static BigDecimal escala(BigDecimal valor) {
        if (valor == null) {
            return BigDecimal.ZERO.setScale(2);
        }
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal multiplicar(BigDecimal a, BigDecimal b) {
        return a.multiply(b).setScale(2, RoundingMode.HALF_UP);
    }
}
