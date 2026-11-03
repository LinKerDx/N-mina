package mx.nomina360.rh.servicio;

import mx.nomina360.commons.web.error.NotFoundException;
import mx.nomina360.rh.dominio.ConceptoNomina;
import mx.nomina360.rh.dominio.Departamento;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.PeriodoNomina;
import mx.nomina360.rh.dominio.Puesto;
import mx.nomina360.rh.dominio.ReciboNomina;
import mx.nomina360.rh.dto.MiPerfilRespuesta;
import mx.nomina360.rh.dto.MiPeriodoResumen;
import mx.nomina360.rh.dto.MiReciboDetalle;
import mx.nomina360.rh.dto.MiReciboResumen;
import mx.nomina360.rh.dto.MiResumenNomina;
import mx.nomina360.rh.dto.RespuestaConcepto;
import mx.nomina360.rh.repositorio.ConceptoNominaRepository;
import mx.nomina360.rh.repositorio.DepartamentoRepository;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import mx.nomina360.rh.repositorio.PeriodoNominaRepository;
import mx.nomina360.rh.repositorio.PuestoRepository;
import mx.nomina360.rh.repositorio.ReciboNominaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Casos de uso del portal de autoservicio del empleado.
 *
 * <p>La identidad se resuelve por el correo del token: el usuario de
 * {@code auth_db} y el empleado de {@code rh_db} comparten correo. Todas las
 * consultas se filtran por el empleado autenticado; un recibo ajeno se reporta
 * como inexistente para no filtrar información.
 */
@Service
public class MiNominaService {

    private final EmpleadoRepository empleados;
    private final ReciboNominaRepository recibos;
    private final ConceptoNominaRepository conceptos;
    private final PeriodoNominaRepository periodos;
    private final DepartamentoRepository departamentos;
    private final PuestoRepository puestos;
    private final ReciboPdfService reciboPdfService;

    public MiNominaService(EmpleadoRepository empleados,
                           ReciboNominaRepository recibos,
                           ConceptoNominaRepository conceptos,
                           PeriodoNominaRepository periodos,
                           DepartamentoRepository departamentos,
                           PuestoRepository puestos,
                           ReciboPdfService reciboPdfService) {
        this.empleados = empleados;
        this.recibos = recibos;
        this.conceptos = conceptos;
        this.periodos = periodos;
        this.departamentos = departamentos;
        this.puestos = puestos;
        this.reciboPdfService = reciboPdfService;
    }

    @Transactional(readOnly = true)
    public MiPerfilRespuesta perfil(String email) {
        return perfilDe(empleadoPorCorreo(email));
    }

    @Transactional(readOnly = true)
    public List<MiReciboResumen> recibos(String email) {
        Empleado empleado = empleadoPorCorreo(email);
        List<ReciboNomina> lista = recibos.findByEmpleadoIdOrderByCalculadoEnDesc(empleado.getId());
        Map<UUID, PeriodoNomina> periodosPorId = cargarPeriodos(lista);

        return lista.stream()
                .map(recibo -> new MiReciboResumen(
                        recibo.getId(),
                        MiPeriodoResumen.desde(periodosPorId.get(recibo.getPeriodoId())),
                        recibo.getDiasPagados(),
                        recibo.getTotalPercepciones(),
                        recibo.getTotalDeducciones(),
                        recibo.getNeto(),
                        recibo.getEstatus(),
                        recibo.getCalculadoEn()))
                .toList();
    }

    @Transactional(readOnly = true)
    public MiReciboDetalle detalle(String email, UUID reciboId) {
        Empleado empleado = empleadoPorCorreo(email);
        ReciboNomina recibo = reciboPropio(empleado, reciboId);
        PeriodoNomina periodo = periodos.findById(recibo.getPeriodoId()).orElse(null);

        List<RespuestaConcepto> conceptosRecibo = conceptos.findByReciboIdOrderByOrdenAsc(reciboId).stream()
                .map(this::aConcepto)
                .toList();

        return new MiReciboDetalle(
                recibo.getId(),
                MiPeriodoResumen.desde(periodo),
                perfilDe(empleado),
                recibo.getDiasPagados(),
                recibo.getTotalPercepciones(),
                recibo.getTotalDeducciones(),
                recibo.getNeto(),
                recibo.getEstatus(),
                recibo.getCalculadoEn(),
                conceptosRecibo);
    }

    @Transactional(readOnly = true)
    public MiResumenNomina resumen(String email) {
        Empleado empleado = empleadoPorCorreo(email);
        List<ReciboNomina> lista = recibos.findByEmpleadoIdOrderByCalculadoEnDesc(empleado.getId());

        BigDecimal percepciones = lista.stream()
                .map(ReciboNomina::getTotalPercepciones)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deducciones = lista.stream()
                .map(ReciboNomina::getTotalDeducciones)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal neto = lista.stream()
                .map(ReciboNomina::getNeto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ReciboNomina ultimo = lista.isEmpty() ? null : lista.get(0);
        PeriodoNomina periodoUltimo = ultimo == null ? null
                : periodos.findById(ultimo.getPeriodoId()).orElse(null);

        return new MiResumenNomina(
                lista.size(),
                percepciones,
                deducciones,
                neto,
                ultimo == null ? BigDecimal.ZERO : ultimo.getNeto(),
                periodoUltimo == null ? null : periodoUltimo.getNombre(),
                periodoUltimo == null ? null : periodoUltimo.getFechaPago());
    }

    @Transactional(readOnly = true)
    public ReciboPdfService.DocumentoPdf pdf(String email, UUID reciboId) {
        Empleado empleado = empleadoPorCorreo(email);
        reciboPropio(empleado, reciboId);
        return reciboPdfService.generar(reciboId);
    }

    private Empleado empleadoPorCorreo(String email) {
        return empleados.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException(
                        "No hay un empleado asociado a tu cuenta. Contacta a Recursos Humanos."));
    }

    private ReciboNomina reciboPropio(Empleado empleado, UUID reciboId) {
        ReciboNomina recibo = recibos.findById(reciboId)
                .orElseThrow(() -> new NotFoundException("El recibo no existe"));

        if (empleado.getId() == null || !empleado.getId().equals(recibo.getEmpleadoId())) {
            throw new NotFoundException("El recibo no existe");
        }
        return recibo;
    }

    private MiPerfilRespuesta perfilDe(Empleado empleado) {
        String departamento = empleado.getDepartamentoId() == null ? null
                : departamentos.findById(empleado.getDepartamentoId())
                        .map(Departamento::getNombre)
                        .orElse(null);
        String puesto = empleado.getPuestoId() == null ? null
                : puestos.findById(empleado.getPuestoId())
                        .map(Puesto::getNombre)
                        .orElse(null);
        return MiPerfilRespuesta.desde(empleado, departamento, puesto);
    }

    private Map<UUID, PeriodoNomina> cargarPeriodos(List<ReciboNomina> lista) {
        List<UUID> ids = lista.stream().map(ReciboNomina::getPeriodoId).distinct().toList();
        return periodos.findAllById(ids).stream()
                .collect(Collectors.toMap(PeriodoNomina::getId, Function.identity()));
    }

    private RespuestaConcepto aConcepto(ConceptoNomina concepto) {
        return new RespuestaConcepto(concepto.getTipo(), concepto.getClave(), concepto.getDescripcion(),
                concepto.getImporte(), Boolean.TRUE.equals(concepto.getGravable()));
    }
}
