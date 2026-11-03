package mx.nomina360.rh.servicio;

import mx.nomina360.commons.web.error.NotFoundException;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.PeriodoNomina;
import mx.nomina360.rh.dominio.ReciboNomina;
import mx.nomina360.rh.dto.MiResumenNomina;
import mx.nomina360.rh.repositorio.ConceptoNominaRepository;
import mx.nomina360.rh.repositorio.DepartamentoRepository;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import mx.nomina360.rh.repositorio.PeriodoNominaRepository;
import mx.nomina360.rh.repositorio.PuestoRepository;
import mx.nomina360.rh.repositorio.ReciboNominaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MiNominaServiceTest {

    private static final String CORREO = "ana.lopez@nomina360.mx";

    @Mock
    private EmpleadoRepository empleados;

    @Mock
    private ReciboNominaRepository recibos;

    @Mock
    private ConceptoNominaRepository conceptos;

    @Mock
    private PeriodoNominaRepository periodos;

    @Mock
    private DepartamentoRepository departamentos;

    @Mock
    private PuestoRepository puestos;

    @Mock
    private ReciboPdfService reciboPdfService;

    @InjectMocks
    private MiNominaService servicio;

    private Empleado empleado;

    @BeforeEach
    void prepararEmpleado() {
        empleado = new Empleado();
        empleado.setId(UUID.randomUUID());
        empleado.setNumeroEmpleado("E-001");
        empleado.setNombre("Ana");
        empleado.setApellidoPaterno("Lopez");
        empleado.setEmail(CORREO);
        empleado.setSalarioDiario(new BigDecimal("450.00"));
        empleado.setFechaIngreso(LocalDate.of(2023, 3, 1));
        empleado.setEstatus("ACTIVO");
    }

    @Test
    @DisplayName("Sin empleado asociado al correo responde 404 de negocio")
    void sinEmpleadoAsociado() {
        when(empleados.findByEmailIgnoreCase(CORREO)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.recibos(CORREO))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("No hay un empleado asociado");
    }

    @Test
    @DisplayName("No permite consultar el recibo de otro empleado")
    void reciboAjenoNoVisible() {
        when(empleados.findByEmailIgnoreCase(CORREO)).thenReturn(Optional.of(empleado));

        ReciboNomina ajeno = new ReciboNomina();
        ajeno.setId(UUID.randomUUID());
        ajeno.setEmpleadoId(UUID.randomUUID());
        ajeno.setPeriodoId(UUID.randomUUID());
        when(recibos.findById(ajeno.getId())).thenReturn(Optional.of(ajeno));

        assertThatThrownBy(() -> servicio.detalle(CORREO, ajeno.getId()))
                .isInstanceOf(NotFoundException.class);

        assertThatThrownBy(() -> servicio.pdf(CORREO, ajeno.getId()))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("El resumen acumula percepciones, deducciones y neto de todos los recibos")
    void resumenAcumulado() {
        UUID periodoId = UUID.randomUUID();
        PeriodoNomina periodo = new PeriodoNomina();
        periodo.setId(periodoId);
        periodo.setNombre("Enero 2026");
        periodo.setTipo("MENSUAL");
        periodo.setFechaInicio(LocalDate.of(2026, 1, 1));
        periodo.setFechaFin(LocalDate.of(2026, 1, 31));
        periodo.setFechaPago(LocalDate.of(2026, 1, 31));
        periodo.setDiasPeriodo(31);

        ReciboNomina reciente = new ReciboNomina();
        reciente.setId(UUID.randomUUID());
        reciente.setEmpleadoId(UUID.randomUUID());
        reciente.setPeriodoId(periodoId);
        reciente.setTotalPercepciones(new BigDecimal("1500.00"));
        reciente.setTotalDeducciones(new BigDecimal("500.00"));
        reciente.setNeto(new BigDecimal("1000.00"));
        reciente.setCalculadoEn(Instant.now());

        ReciboNomina anterior = new ReciboNomina();
        anterior.setId(UUID.randomUUID());
        anterior.setEmpleadoId(reciente.getEmpleadoId());
        anterior.setPeriodoId(periodoId);
        anterior.setTotalPercepciones(new BigDecimal("2500.00"));
        anterior.setTotalDeducciones(new BigDecimal("500.00"));
        anterior.setNeto(new BigDecimal("2000.00"));
        anterior.setCalculadoEn(Instant.now().minusSeconds(86400));

        when(empleados.findByEmailIgnoreCase(CORREO)).thenReturn(Optional.of(empleado));
        when(recibos.findByEmpleadoIdOrderByCalculadoEnDesc(empleado.getId()))
                .thenReturn(List.of(reciente, anterior));
        when(periodos.findById(periodoId)).thenReturn(Optional.of(periodo));

        MiResumenNomina resumen = servicio.resumen(CORREO);

        assertThat(resumen.totalRecibos()).isEqualTo(2);
        assertThat(resumen.totalPercepciones()).isEqualByComparingTo("4000.00");
        assertThat(resumen.totalDeducciones()).isEqualByComparingTo("1000.00");
        assertThat(resumen.totalNeto()).isEqualByComparingTo("3000.00");
        assertThat(resumen.ultimoNeto()).isEqualByComparingTo("1000.00");
        assertThat(resumen.ultimoPeriodo()).isEqualTo("Enero 2026");
        assertThat(resumen.ultimaFechaPago()).isEqualTo(LocalDate.of(2026, 1, 31));
    }
}
