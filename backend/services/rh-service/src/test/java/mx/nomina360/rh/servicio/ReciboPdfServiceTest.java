package mx.nomina360.rh.servicio;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import mx.nomina360.rh.dominio.ConceptoNomina;
import mx.nomina360.rh.dominio.Departamento;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.PeriodoNomina;
import mx.nomina360.rh.dominio.Puesto;
import mx.nomina360.rh.dominio.ReciboNomina;
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
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReciboPdfServiceTest {

    private final UUID reciboId = UUID.randomUUID();
    private final UUID periodoId = UUID.randomUUID();
    private final UUID empleadoId = UUID.randomUUID();
    private final UUID departamentoId = UUID.randomUUID();
    private final UUID puestoId = UUID.randomUUID();

    @Mock
    private ReciboNominaRepository recibos;

    @Mock
    private ConceptoNominaRepository conceptos;

    @Mock
    private EmpleadoRepository empleados;

    @Mock
    private PeriodoNominaRepository periodos;

    @Mock
    private DepartamentoRepository departamentos;

    @Mock
    private PuestoRepository puestos;

    @InjectMocks
    private ReciboPdfService servicio;

    @BeforeEach
    void prepararDatos() {
        Departamento departamento = new Departamento();
        departamento.setNombre("Produccion");
        Puesto puesto = new Puesto();
        puesto.setNombre("Operador de linea");

        Empleado empleado = new Empleado();
        empleado.setNumeroEmpleado("E-001");
        empleado.setNombre("Ana");
        empleado.setApellidoPaterno("Lopez");
        empleado.setApellidoMaterno("Garcia");
        empleado.setCurp("LOGA930101MDFPRN01");
        empleado.setRfc("LOGA930101AB1");
        empleado.setNss("12345678901");
        empleado.setEmail("ana.lopez@nomina360.mx");
        empleado.setTelefono("5555555555");
        empleado.setDepartamentoId(departamentoId);
        empleado.setPuestoId(puestoId);
        empleado.setTipoContrato("INDEFINIDO");
        empleado.setFechaIngreso(LocalDate.of(2023, 3, 1));
        empleado.setSalarioDiario(new BigDecimal("450.00"));
        empleado.setEstatus("ACTIVO");

        PeriodoNomina periodo = new PeriodoNomina();
        periodo.setNombre("Enero 2026");
        periodo.setTipo("MENSUAL");
        periodo.setFechaInicio(LocalDate.of(2026, 1, 1));
        periodo.setFechaFin(LocalDate.of(2026, 1, 31));
        periodo.setFechaPago(LocalDate.of(2026, 1, 31));
        periodo.setDiasPeriodo(31);
        periodo.setEstatus("CALCULADO");

        ReciboNomina recibo = new ReciboNomina();
        recibo.setId(reciboId);
        recibo.setPeriodoId(periodoId);
        recibo.setEmpleadoId(empleadoId);
        recibo.setNumeroEmpleado("E-001");
        recibo.setNombreEmpleado("Ana Lopez Garcia");
        recibo.setDiasPagados(new BigDecimal("31.00"));
        recibo.setTotalPercepciones(new BigDecimal("14287.50"));
        recibo.setTotalDeducciones(new BigDecimal("1755.26"));
        recibo.setNeto(new BigDecimal("12532.24"));
        recibo.setEstatus("CALCULADO");
        recibo.setCalculadoEn(Instant.now());

        ConceptoNomina sueldo = new ConceptoNomina();
        sueldo.setTipo("PERCEPCION");
        sueldo.setClave("001");
        sueldo.setDescripcion("Sueldo");
        sueldo.setImporte(new BigDecimal("13950.00"));
        sueldo.setGravable(true);
        sueldo.setOrden(1);

        ConceptoNomina horasExtra = new ConceptoNomina();
        horasExtra.setTipo("PERCEPCION");
        horasExtra.setClave("003");
        horasExtra.setDescripcion("Horas extra dobles");
        horasExtra.setImporte(new BigDecimal("337.50"));
        horasExtra.setGravable(true);
        horasExtra.setOrden(2);

        ConceptoNomina isr = new ConceptoNomina();
        isr.setTipo("DEDUCCION");
        isr.setClave("103");
        isr.setDescripcion("ISR");
        isr.setImporte(new BigDecimal("1387.26"));
        isr.setGravable(false);
        isr.setOrden(3);

        ConceptoNomina imss = new ConceptoNomina();
        imss.setTipo("DEDUCCION");
        imss.setClave("104");
        imss.setDescripcion("Cuota obrera IMSS");
        imss.setImporte(new BigDecimal("368.00"));
        imss.setGravable(false);
        imss.setOrden(4);

        when(recibos.findById(reciboId)).thenReturn(Optional.of(recibo));
        when(periodos.findById(periodoId)).thenReturn(Optional.of(periodo));
        when(empleados.findById(empleadoId)).thenReturn(Optional.of(empleado));
        when(departamentos.findById(departamentoId)).thenReturn(Optional.of(departamento));
        when(puestos.findById(puestoId)).thenReturn(Optional.of(puesto));
        when(conceptos.findByReciboIdOrderByOrdenAsc(reciboId))
                .thenReturn(List.of(sueldo, horasExtra, isr, imss));
    }

    @Test
    @DisplayName("Genera un PDF válido con datos del trabajador y desglose")
    void generaPdfConDatosYDesglose() throws Exception {
        ReciboPdfService.DocumentoPdf documento = servicio.generar(reciboId);

        assertThat(documento.contenido().length).isGreaterThan(1500);
        assertThat(new String(documento.contenido(), 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");
        assertThat(documento.nombreArchivo()).isEqualTo("recibo-E-001-Enero-2026.pdf");

        PdfReader lector = new PdfReader(documento.contenido());
        try {
            String texto = new PdfTextExtractor(lector).getTextFromPage(1);

            assertThat(texto)
                    .contains("RECIBO DE NOMINA")
                    .contains("Ana Lopez Garcia")
                    .contains("LOGA930101MDFPRN01")
                    .contains("12345678901")
                    .contains("Operador de linea")
                    .contains("Produccion")
                    .contains("Sueldo")
                    .contains("Horas extra dobles")
                    .contains("ISR")
                    .contains("Cuota obrera IMSS")
                    .contains("NETO A PAGAR");
        } finally {
            lector.close();
        }
    }

    @Test
    @DisplayName("El nombre del archivo usa el número de empleado y el periodo")
    void nombreArchivoLegible() {
        ReciboPdfService.DocumentoPdf documento = servicio.generar(reciboId);
        assertThat(documento.nombreArchivo()).startsWith("recibo-E-001-").endsWith(".pdf");
    }
}
