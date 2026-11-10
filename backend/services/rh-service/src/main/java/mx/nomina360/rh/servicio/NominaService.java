package mx.nomina360.rh.servicio;

import mx.nomina360.commons.web.error.BusinessException;
import mx.nomina360.commons.web.error.ConflictException;
import mx.nomina360.commons.web.error.NotFoundException;
import mx.nomina360.rh.dominio.ConceptoNomina;
import mx.nomina360.rh.dominio.AjusteNomina;
import mx.nomina360.rh.dominio.CuotaImss;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.Incidencia;
import mx.nomina360.rh.dominio.ParametroNomina;
import mx.nomina360.rh.dominio.PeriodoNomina;
import mx.nomina360.rh.dominio.ReciboNomina;
import mx.nomina360.rh.dominio.TarifaIsr;
import mx.nomina360.rh.dto.RespuestaCalculo;
import mx.nomina360.rh.dto.RespuestaConcepto;
import mx.nomina360.rh.dto.RespuestaPeriodo;
import mx.nomina360.rh.dto.RespuestaRecibo;
import mx.nomina360.rh.dto.RespuestaResumenGeneral;
import mx.nomina360.rh.dto.SolicitudPeriodo;
import mx.nomina360.rh.nomina.CalculadoraNomina;
import mx.nomina360.rh.nomina.ParametrosNomina;
import mx.nomina360.rh.nomina.ResultadoCalculo;
import mx.nomina360.rh.repositorio.ConceptoNominaRepository;
import mx.nomina360.rh.repositorio.AjusteNominaRepository;
import mx.nomina360.rh.repositorio.CuotaImssRepository;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import mx.nomina360.rh.repositorio.IncidenciaRepository;
import mx.nomina360.rh.repositorio.ParametroNominaRepository;
import mx.nomina360.rh.repositorio.PeriodoNominaRepository;
import mx.nomina360.rh.repositorio.ReciboNominaRepository;
import mx.nomina360.rh.repositorio.TarifaIsrRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NominaService {

    private static final Logger log = LoggerFactory.getLogger(NominaService.class);
    private static final String ESTATUS_BORRADOR = "BORRADOR";
    private static final String ESTATUS_CALCULADO = "CALCULADO";
    private static final String ESTATUS_CERRADO = "CERRADO";

    private final PeriodoNominaRepository periodos;
    private final ReciboNominaRepository recibos;
    private final ConceptoNominaRepository conceptos;
    private final AjusteNominaRepository ajustes;
    private final EmpleadoRepository empleados;
    private final IncidenciaRepository incidencias;
    private final TarifaIsrRepository tarifasIsr;
    private final CuotaImssRepository cuotasImss;
    private final ParametroNominaRepository parametros;
    private final CalculadoraNomina calculadora;

    public NominaService(PeriodoNominaRepository periodos,
                         ReciboNominaRepository recibos,
                         ConceptoNominaRepository conceptos,
                         AjusteNominaRepository ajustes,
                         EmpleadoRepository empleados,
                         IncidenciaRepository incidencias,
                         TarifaIsrRepository tarifasIsr,
                         CuotaImssRepository cuotasImss,
                         ParametroNominaRepository parametros,
                         CalculadoraNomina calculadora) {
        this.periodos = periodos;
        this.recibos = recibos;
        this.conceptos = conceptos;
        this.ajustes = ajustes;
        this.empleados = empleados;
        this.incidencias = incidencias;
        this.tarifasIsr = tarifasIsr;
        this.cuotasImss = cuotasImss;
        this.parametros = parametros;
        this.calculadora = calculadora;
    }

    @Transactional
    public RespuestaPeriodo crearPeriodo(SolicitudPeriodo solicitud) {
        if (solicitud.fechaFin().isBefore(solicitud.fechaInicio())) {
            throw new BusinessException("FECHAS_INVALIDAS",
                    "La fecha de fin no puede ser anterior a la fecha de inicio", HttpStatus.BAD_REQUEST);
        }
        if (periodos.existsByTipoAndFechaInicio(solicitud.tipo(), solicitud.fechaInicio())) {
            throw new ConflictException("Ya existe un periodo " + solicitud.tipo()
                    + " que inicia el " + solicitud.fechaInicio());
        }

        PeriodoNomina periodo = new PeriodoNomina();
        periodo.setNombre(solicitud.nombre().trim());
        periodo.setTipo(solicitud.tipo());
        periodo.setFechaInicio(solicitud.fechaInicio());
        periodo.setFechaFin(solicitud.fechaFin());
        periodo.setFechaPago(solicitud.fechaPago());
        periodo.setDiasPeriodo((int) ChronoUnit.DAYS.between(solicitud.fechaInicio(), solicitud.fechaFin()) + 1);
        periodo.setEstatus(ESTATUS_BORRADOR);

        return RespuestaPeriodo.desde(periodos.save(periodo));
    }

    @Transactional(readOnly = true)
    public Page<RespuestaPeriodo> listarPeriodos(int pagina, int tamano) {
        Pageable pageable = PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamano, 1), 50));
        return periodos.findAllByOrderByFechaInicioDesc(pageable).map(RespuestaPeriodo::desde);
    }

    /**
     * Calcula los recibos del periodo y lo marca como CALCULADO. Solo se permite
     * una vez por periodo (para recalcular hay que crear un periodo nuevo).
     */
    @Transactional
    public RespuestaCalculo calcular(UUID periodoId) {
        PeriodoNomina periodo = buscarPeriodo(periodoId);
        if (!periodo.esCalculable()) {
            throw new ConflictException("El periodo esta en estatus " + periodo.getEstatus()
                    + " y ya no se puede calcular");
        }
        if (recibos.countByPeriodoId(periodoId) > 0) {
            throw new ConflictException("El periodo ya tiene recibos generados");
        }

        List<TarifaIsr> tarifas = tarifasDelPeriodo(periodo);
        List<CuotaImss> cuotas = cuotasVigentes(periodo.getFechaPago());
        ParametrosNomina parametrosNomina = parametrosCargados();

        Map<UUID, List<Incidencia>> incidenciasPorEmpleado = incidencias
                .findByFechaBetweenOrderByFechaAsc(periodo.getFechaInicio(), periodo.getFechaFin())
                .stream()
                .collect(Collectors.groupingBy(Incidencia::getEmpleadoId));
        Map<UUID, List<AjusteNomina>> ajustesPorEmpleado = ajustes
                .findByPeriodoIdOrderByCreadoEnAsc(periodoId).stream()
                .collect(Collectors.groupingBy(AjusteNomina::getEmpleadoId));

        int generados = 0;
        for (Empleado empleado : empleados.findByEstatus("ACTIVO")) {
            ResultadoCalculo resultado = calculadora.calcular(empleado, periodo,
                    incidenciasPorEmpleado.getOrDefault(empleado.getId(), List.of()),
                    tarifas, cuotas, parametrosNomina,
                    ajustesPorEmpleado.getOrDefault(empleado.getId(), List.of()));

            if (resultado.neto().signum() < 0) {
                throw new BusinessException("DEDUCCIONES_EXCEDEN_NETO",
                        "Las deducciones superan el neto calculado de " + empleado.nombreCompleto(),
                        HttpStatus.BAD_REQUEST);
            }

            if (resultado.sinPago()) {
                log.debug("Empleado {} sin dias pagables en el periodo {}", empleado.getNumeroEmpleado(), periodoId);
                continue;
            }

            ReciboNomina recibo = new ReciboNomina();
            recibo.setPeriodoId(periodoId);
            recibo.setEmpleadoId(empleado.getId());
            recibo.setNumeroEmpleado(empleado.getNumeroEmpleado());
            recibo.setNombreEmpleado(empleado.nombreCompleto());
            recibo.setDiasPagados(resultado.diasPagados());
            recibo.setTotalPercepciones(resultado.totalPercepciones());
            recibo.setTotalDeducciones(resultado.totalDeducciones());
            recibo.setNeto(resultado.neto());
            recibos.save(recibo);

            List<ConceptoNomina> entidades = resultado.conceptos().stream()
                    .map(c -> {
                        ConceptoNomina concepto = new ConceptoNomina();
                        concepto.setReciboId(recibo.getId());
                        concepto.setTipo(c.tipo());
                        concepto.setClave(c.clave());
                        concepto.setDescripcion(c.descripcion());
                        concepto.setImporte(c.importe());
                        concepto.setGravable(c.gravable());
                        concepto.setOrden(c.orden());
                        return concepto;
                    })
                    .toList();
            conceptos.saveAll(entidades);
            generados++;
        }

        periodo.setEstatus(ESTATUS_CALCULADO);
        periodo.setCalculadoEn(Instant.now());
        periodos.save(periodo);

        log.info("Nomina calculada periodo={} recibos={} tarifasEjercicio={}",
                periodo.getNombre(), generados,
                tarifas.isEmpty() ? "sin tarifas" : tarifas.get(0).getEjercicio());

        return new RespuestaCalculo(periodoId, periodo.getNombre(), generados,
                recibos.sumaPercepciones(periodoId),
                recibos.sumaDeducciones(periodoId),
                recibos.sumaNeto(periodoId));
    }

    @Transactional
    public RespuestaPeriodo cerrarPeriodo(UUID periodoId) {
        PeriodoNomina periodo = buscarPeriodo(periodoId);
        if (!ESTATUS_CALCULADO.equals(periodo.getEstatus())) {
            throw new ConflictException("Solo se pueden cerrar periodos en estatus CALCULADO");
        }
        periodo.setEstatus(ESTATUS_CERRADO);
        return RespuestaPeriodo.desde(periodos.save(periodo));
    }

    @Transactional(readOnly = true)
    public List<RespuestaRecibo> recibosDePeriodo(UUID periodoId) {
        buscarPeriodo(periodoId);
        List<ReciboNomina> lista = recibos.findByPeriodoIdOrderByNombreEmpleadoAsc(periodoId);
        if (lista.isEmpty()) {
            return List.of();
        }

        Map<UUID, List<RespuestaConcepto>> conceptosPorRecibo = conceptos
                .findByReciboIdIn(lista.stream().map(ReciboNomina::getId).toList())
                .stream()
                .sorted((a, b) -> Integer.compare(a.getOrden(), b.getOrden()))
                .collect(Collectors.groupingBy(ConceptoNomina::getReciboId, LinkedHashMap::new,
                        Collectors.mapping(c -> new RespuestaConcepto(c.getTipo(), c.getClave(),
                                c.getDescripcion(), c.getImporte(), Boolean.TRUE.equals(c.getGravable())),
                                Collectors.toList())));

        return lista.stream()
                .map(r -> new RespuestaRecibo(r.getId(), r.getEmpleadoId(), r.getNumeroEmpleado(),
                        r.getNombreEmpleado(), r.getDiasPagados(), r.getTotalPercepciones(),
                        r.getTotalDeducciones(), r.getNeto(), r.getEstatus(),
                        conceptosPorRecibo.getOrDefault(r.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public RespuestaResumenGeneral resumen() {
        long activos = empleados.countByEstatus("ACTIVO");
        long abiertos = periodos.countByEstatus(ESTATUS_BORRADOR);

        Optional<PeriodoNomina> reciente = periodos.findTopByOrderByFechaInicioDesc();
        if (reciente.isEmpty()) {
            return new RespuestaResumenGeneral(activos, abiertos, null, null, null,
                    BigDecimal.ZERO.setScale(2), 0);
        }

        PeriodoNomina periodo = reciente.get();
        return new RespuestaResumenGeneral(activos, abiertos, periodo.getId(), periodo.getNombre(),
                periodo.getEstatus(), recibos.sumaNeto(periodo.getId()),
                recibos.countByPeriodoId(periodo.getId()));
    }

    private PeriodoNomina buscarPeriodo(UUID id) {
        return periodos.findById(id).orElseThrow(() -> new NotFoundException("El periodo de nomina no existe"));
    }

    private List<TarifaIsr> tarifasDelPeriodo(PeriodoNomina periodo) {
        int ejercicio = periodo.getFechaPago().getYear();
        List<TarifaIsr> tarifas = tarifasIsr.findByEjercicioOrderByLimiteInferiorAsc(ejercicio);
        if (!tarifas.isEmpty()) {
            return tarifas;
        }
        int ultimo = tarifasIsr.maxEjercicio().orElse(0);
        if (ultimo == 0) {
            log.warn("No hay tarifas de ISR cargadas: el ISR se calculara en cero");
            return List.of();
        }
        log.warn("No hay tarifa de ISR para {}; se reutiliza la del ejercicio {}", ejercicio, ultimo);
        return tarifasIsr.findByEjercicioOrderByLimiteInferiorAsc(ultimo);
    }

    private List<CuotaImss> cuotasVigentes(LocalDate fecha) {
        Map<String, CuotaImss> porConcepto = new LinkedHashMap<>();
        for (CuotaImss cuota : cuotasImss.findByVigenteDesdeLessThanEqualOrderByVigenteDesdeDesc(fecha)) {
            porConcepto.putIfAbsent(cuota.getConcepto(), cuota);
        }
        return List.copyOf(porConcepto.values());
    }

    private ParametrosNomina parametrosCargados() {
        Map<String, BigDecimal> valores = parametros.findAll().stream()
                .collect(Collectors.toMap(ParametroNomina::getClave, ParametroNomina::getValor));
        return ParametrosNomina.desde(valores);
    }
}
