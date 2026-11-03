package mx.nomina360.administracion.servicio;

import mx.nomina360.administracion.dominio.CentroCosto;
import mx.nomina360.administracion.dominio.Pago;
import mx.nomina360.administracion.dominio.Presupuesto;
import mx.nomina360.administracion.dto.RespuestaCentroCosto;
import mx.nomina360.administracion.dto.RespuestaPago;
import mx.nomina360.administracion.dto.RespuestaPresupuesto;
import mx.nomina360.administracion.dto.RespuestaProveedor;
import mx.nomina360.administracion.dto.RespuestaResumenAdmin;
import mx.nomina360.administracion.dto.SolicitudPago;
import mx.nomina360.administracion.dto.SolicitudPresupuesto;
import mx.nomina360.administracion.repositorio.CentroCostoRepository;
import mx.nomina360.administracion.repositorio.PagoRepository;
import mx.nomina360.administracion.repositorio.PresupuestoRepository;
import mx.nomina360.administracion.repositorio.ProveedorRepository;
import mx.nomina360.commons.web.error.BusinessException;
import mx.nomina360.commons.web.error.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdministracionService {

    private static final Logger log = LoggerFactory.getLogger(AdministracionService.class);
    private static final BigDecimal CIEN = new BigDecimal("100");

    private final CentroCostoRepository centros;
    private final PresupuestoRepository presupuestos;
    private final ProveedorRepository proveedores;
    private final PagoRepository pagos;
    private final SecureRandom aleatorio = new SecureRandom();

    public AdministracionService(CentroCostoRepository centros,
                                 PresupuestoRepository presupuestos,
                                 ProveedorRepository proveedores,
                                 PagoRepository pagos) {
        this.centros = centros;
        this.presupuestos = presupuestos;
        this.proveedores = proveedores;
        this.pagos = pagos;
    }

    @Transactional
    public RespuestaPago registrarPago(SolicitudPago solicitud) {
        if (!centros.existsById(solicitud.centroCostoId())) {
            throw new BusinessException("CENTRO_INEXISTENTE", "El centro de costo no existe", HttpStatus.BAD_REQUEST);
        }
        if (solicitud.proveedorId() != null && !proveedores.existsById(solicitud.proveedorId())) {
            throw new BusinessException("PROVEEDOR_INEXISTENTE", "El proveedor no existe", HttpStatus.BAD_REQUEST);
        }

        int ejercicio = solicitud.fechaPago().getYear();
        int mes = solicitud.fechaPago().getMonthValue();

        Presupuesto presupuesto = presupuestos
                .bloquear(solicitud.centroCostoId(), ejercicio, mes)
                .orElseThrow(() -> new BusinessException("SIN_PRESUPUESTO",
                        "No hay presupuesto definido para el centro de costo en " + mes + "/" + ejercicio,
                        HttpStatus.UNPROCESSABLE_ENTITY));

        BigDecimal disponible = presupuesto.getMontoPresupuestado().subtract(presupuesto.getMontoEjercido());
        if (solicitud.monto().compareTo(disponible) > 0) {
            throw new BusinessException("PRESUPUESTO_EXCEDIDO",
                    "El pago de " + solicitud.monto() + " excede el disponible de " + disponible,
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        Pago pago = new Pago();
        pago.setFolio(generarFolio(ejercicio));
        pago.setTipo(solicitud.tipo());
        pago.setReferenciaExterna(solicitud.referenciaExterna());
        pago.setProveedorId(solicitud.proveedorId());
        pago.setCentroCostoId(solicitud.centroCostoId());
        pago.setPeriodoNominaId(solicitud.periodoNominaId());
        pago.setMonto(solicitud.monto());
        pago.setMoneda(solicitud.moneda() == null ? "MXN" : solicitud.moneda());
        pago.setFechaPago(solicitud.fechaPago());
        pago.setEstatus("PAGADO");

        presupuesto.setMontoEjercido(presupuesto.getMontoEjercido().add(solicitud.monto()));
        presupuestos.save(presupuesto);
        Pago guardado = pagos.save(pago);

        log.info("Pago registrado folio={} monto={} centro={}", guardado.getFolio(),
                guardado.getMonto(), guardado.getCentroCostoId());
        return RespuestaPago.desde(guardado);
    }

    @Transactional
    public RespuestaPresupuesto definirPresupuesto(SolicitudPresupuesto solicitud) {
        CentroCosto centro = centros.findById(solicitud.centroCostoId())
                .orElseThrow(() -> new BusinessException("CENTRO_INEXISTENTE",
                        "El centro de costo no existe", HttpStatus.BAD_REQUEST));

        Presupuesto presupuesto = presupuestos
                .findByCentroCostoIdAndEjercicioAndMes(solicitud.centroCostoId(), solicitud.ejercicio(), solicitud.mes())
                .orElseGet(Presupuesto::new);

        BigDecimal ejercido = presupuesto.getMontoEjercido() == null ? BigDecimal.ZERO : presupuesto.getMontoEjercido();
        if (solicitud.montoPresupuestado().compareTo(ejercido) < 0) {
            throw new BusinessException("PRESUPUESTO_INSUFICIENTE",
                    "El monto presupuestado no puede ser menor a lo ya ejercido (" + ejercido + ")",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        presupuesto.setCentroCostoId(solicitud.centroCostoId());
        presupuesto.setEjercicio(solicitud.ejercicio());
        presupuesto.setMes(solicitud.mes());
        presupuesto.setMontoPresupuestado(solicitud.montoPresupuestado());
        presupuesto.setMontoEjercido(ejercido);

        return mapear(presupuestos.save(presupuesto), centro.getNombre());
    }

    @Transactional(readOnly = true)
    public List<RespuestaPresupuesto> listarPresupuestos(int ejercicio) {
        Map<UUID, String> nombres = centros.findAll().stream()
                .collect(Collectors.toMap(CentroCosto::getId, CentroCosto::getNombre));
        return presupuestos.findByEjercicioOrderByCentroCostoIdAscMesAsc(ejercicio).stream()
                .map(p -> mapear(p, nombres.get(p.getCentroCostoId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RespuestaPago> listarPagos(LocalDate desde, LocalDate hasta) {
        LocalDate inicio = desde != null ? desde : LocalDate.now().withDayOfMonth(1);
        LocalDate fin = hasta != null ? hasta : LocalDate.now();
        return pagos.findByFechaPagoBetweenOrderByFechaPagoDesc(inicio, fin).stream()
                .map(RespuestaPago::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public RespuestaResumenAdmin resumen(int ejercicio) {
        BigDecimal presupuestado = presupuestos.totalPresupuestado(ejercicio);
        BigDecimal ejercido = presupuestos.totalEjercido(ejercicio);

        LocalDate hoy = LocalDate.now();
        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate finMes = hoy.withDayOfMonth(hoy.lengthOfMonth());

        return new RespuestaResumenAdmin(ejercicio, presupuestado, ejercido,
                presupuestado.subtract(ejercido), pagos.countByFechaPagoBetween(inicioMes, finMes),
                pagos.totalPagado(inicioMes, finMes));
    }

    @Transactional(readOnly = true)
    public List<RespuestaCentroCosto> centros() {
        return centros.findAll().stream().map(RespuestaCentroCosto::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<RespuestaProveedor> proveedores() {
        return proveedores.findAll().stream().map(RespuestaProveedor::desde).toList();
    }

    private RespuestaPresupuesto mapear(Presupuesto presupuesto, String centroNombre) {
        BigDecimal disponible = presupuesto.getMontoPresupuestado().subtract(presupuesto.getMontoEjercido()).max(BigDecimal.ZERO);
        BigDecimal porcentaje = presupuesto.getMontoPresupuestado().signum() == 0
                ? BigDecimal.ZERO
                : presupuesto.getMontoEjercido().multiply(CIEN)
                        .divide(presupuesto.getMontoPresupuestado(), 2, RoundingMode.HALF_UP);

        return new RespuestaPresupuesto(presupuesto.getId(), presupuesto.getCentroCostoId(), centroNombre,
                presupuesto.getEjercicio(), presupuesto.getMes(), presupuesto.getMontoPresupuestado(),
                presupuesto.getMontoEjercido(), disponible, porcentaje);
    }

    private String generarFolio(int ejercicio) {
        for (int intento = 0; intento < 5; intento++) {
            String folio = String.format("PAG-%d-%06d", ejercicio, aleatorio.nextInt(1_000_000));
            if (!pagos.existsByFolio(folio)) {
                return folio;
            }
        }
        return "PAG-" + ejercicio + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
