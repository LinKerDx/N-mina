package mx.nomina360.rh.nomina;

import mx.nomina360.rh.dominio.CuotaImss;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.Incidencia;
import mx.nomina360.rh.dominio.PeriodoNomina;
import mx.nomina360.rh.dominio.TarifaIsr;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadoraNominaTest {

    private final CalculadoraNomina calculadora = new CalculadoraNomina();
    private final ParametrosNomina parametros = ParametrosNomina.porDefecto();

    private List<TarifaIsr> tarifas;
    private List<CuotaImss> cuotas;

    @BeforeEach
    void prepararTablas() {
        tarifas = List.of(
                tarifa("0.01", "746.04", "0.00", "0.0192"),
                tarifa("746.05", "6332.05", "14.32", "0.0640"),
                tarifa("6332.06", "11128.01", "371.83", "0.1088"),
                tarifa("11128.02", "12935.82", "893.63", "0.1600"),
                tarifa("12935.83", "15487.71", "1182.88", "0.1792"),
                tarifa("15487.72", "18599.15", "1640.18", "0.2136"),
                tarifa("18599.16", "37458.02", "2304.17", "0.2352"),
                tarifa("37458.03", "59063.02", "6746.68", "0.3000"),
                tarifa("59063.03", "185592.00", "13228.18", "0.3200"),
                tarifa("185592.01", "374838.00", "53717.42", "0.3400"),
                tarifa("374838.01", null, "118021.06", "0.3500"));

        cuotas = List.of(
                cuota("PRESTACIONES_EN_DINERO", "0.0025"),
                cuota("GASTOS_MEDICOS_PENSIONADOS", "0.00375"),
                cuota("INVALIDEZ_Y_VIDA", "0.00625"),
                cuota("CESANTIA_Y_VEJEZ", "0.01125"),
                cuota("EXCEDENTE_3_UMA", "0.0040"));
    }

    @Test
    @DisplayName("Nomina mensual sin incidencias: sueldo, ISR e IMSS")
    void calculaNominaMensualSinIncidencias() {
        Empleado empleado = empleado("500.00", LocalDate.of(2023, 1, 1));
        PeriodoNomina periodo = periodo(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));

        ResultadoCalculo resultado = calculadora.calcular(empleado, periodo, List.of(), tarifas, cuotas, parametros);

        assertThat(resultado.diasPagados()).isEqualByComparingTo("30.00");
        assertThat(resultado.totalPercepciones()).isEqualByComparingTo("15000.00");
        assertThat(buscar(resultado, "103")).isEqualByComparingTo("1552.78"); // ISR
        assertThat(buscar(resultado, "104")).isEqualByComparingTo("397.68");  // IMSS
        assertThat(resultado.totalDeducciones()).isEqualByComparingTo("1950.46");
        assertThat(resultado.neto()).isEqualByComparingTo("13049.54");
    }

    @Test
    @DisplayName("Una falta descuenta un dia de sueldo y reduce la base de ISR")
    void descuentaFaltaYRecalculaIsr() {
        Empleado empleado = empleado("500.00", LocalDate.of(2023, 1, 1));
        PeriodoNomina periodo = periodo(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));
        Incidencia falta = incidencia(TiposIncidencia.FALTA, "1");

        ResultadoCalculo resultado = calculadora.calcular(empleado, periodo, List.of(falta),
                tarifas, cuotas, parametros);

        assertThat(buscar(resultado, "101")).isEqualByComparingTo("500.00");
        assertThat(buscar(resultado, "103")).isEqualByComparingTo("1463.18");
        assertThat(resultado.neto()).isEqualByComparingTo("12639.14");
    }

    @Test
    @DisplayName("Prorratea el sueldo por ingreso a mitad de periodo")
    void prorrateaPorIngresoAMitadDePeriodo() {
        Empleado empleado = empleado("500.00", LocalDate.of(2026, 1, 16));
        PeriodoNomina periodo = periodo(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));

        ResultadoCalculo resultado = calculadora.calcular(empleado, periodo, List.of(), tarifas, cuotas, parametros);

        assertThat(resultado.diasPagados()).isEqualByComparingTo("16.00");
        assertThat(resultado.totalPercepciones()).isEqualByComparingTo("8000.00");
        assertThat(buscar(resultado, "103")).isEqualByComparingTo("553.30");
        assertThat(resultado.neto()).isEqualByComparingTo("7234.59");
    }

    @Test
    @DisplayName("Las primeras 9 horas extra semanales se pagan al doble y el resto al triple")
    void pagaHorasExtraDoblesYTriples() {
        Empleado empleado = empleado("500.00", LocalDate.of(2023, 1, 1));
        PeriodoNomina periodo = periodo(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));
        Incidencia horas = incidencia(TiposIncidencia.HORAS_EXTRA, "12");

        ResultadoCalculo resultado = calculadora.calcular(empleado, periodo, List.of(horas),
                tarifas, cuotas, parametros);

        assertThat(buscar(resultado, "003")).isEqualByComparingTo("1125.00"); // 9 x 62.50 x 2
        assertThat(buscar(resultado, "004")).isEqualByComparingTo("562.50");  // 3 x 62.50 x 3
        assertThat(resultado.totalPercepciones()).isEqualByComparingTo("16687.50");
    }

    @Test
    @DisplayName("No genera recibo si el empleado no tiene dias activos en el periodo")
    void omiteEmpleadoSinDiasEnElPeriodo() {
        Empleado empleado = empleado("500.00", LocalDate.of(2023, 1, 1));
        empleado.setFechaBaja(LocalDate.of(2025, 12, 31));
        PeriodoNomina periodo = periodo(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));

        ResultadoCalculo resultado = calculadora.calcular(empleado, periodo, List.of(), tarifas, cuotas, parametros);

        assertThat(resultado.sinPago()).isTrue();
        assertThat(resultado.neto()).isEqualByComparingTo("0.00");
    }

    private BigDecimal buscar(ResultadoCalculo resultado, String clave) {
        return resultado.conceptos().stream()
                .filter(c -> clave.equals(c.clave()))
                .map(ConceptoCalculado::importe)
                .findFirst()
                .orElseThrow(() -> new AssertionError("No existe el concepto " + clave));
    }

    private static Empleado empleado(String salarioDiario, LocalDate ingreso) {
        Empleado empleado = new Empleado();
        empleado.setNumeroEmpleado("E-001");
        empleado.setNombre("Ana");
        empleado.setApellidoPaterno("Lopez");
        empleado.setSalarioDiario(new BigDecimal(salarioDiario));
        empleado.setFechaIngreso(ingreso);
        empleado.setEstatus("ACTIVO");
        return empleado;
    }

    private static PeriodoNomina periodo(LocalDate inicio, LocalDate fin) {
        PeriodoNomina periodo = new PeriodoNomina();
        periodo.setNombre("Periodo de prueba");
        periodo.setTipo("MENSUAL");
        periodo.setFechaInicio(inicio);
        periodo.setFechaFin(fin);
        periodo.setFechaPago(fin);
        periodo.setDiasPeriodo(30);
        return periodo;
    }

    private static Incidencia incidencia(String tipo, String cantidad) {
        Incidencia incidencia = new Incidencia();
        incidencia.setTipo(tipo);
        incidencia.setFecha(LocalDate.of(2026, 1, 10));
        incidencia.setCantidad(new BigDecimal(cantidad));
        incidencia.setAutorizada(true);
        return incidencia;
    }

    private static TarifaIsr tarifa(String inferior, String superior, String cuota, String tasa) {
        TarifaIsr tarifa = new TarifaIsr();
        tarifa.setEjercicio(2025);
        tarifa.setLimiteInferior(new BigDecimal(inferior));
        tarifa.setLimiteSuperior(superior == null ? null : new BigDecimal(superior));
        tarifa.setCuotaFija(new BigDecimal(cuota));
        tarifa.setTasa(new BigDecimal(tasa));
        return tarifa;
    }

    private static CuotaImss cuota(String concepto, String tasa) {
        CuotaImss cuota = new CuotaImss();
        cuota.setConcepto(concepto);
        cuota.setTasaObrera(new BigDecimal(tasa));
        cuota.setVigenteDesde(LocalDate.of(2024, 1, 1));
        return cuota;
    }
}
