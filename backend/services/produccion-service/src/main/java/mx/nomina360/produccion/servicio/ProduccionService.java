package mx.nomina360.produccion.servicio;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import mx.nomina360.commons.web.error.BusinessException;
import mx.nomina360.commons.web.error.ConflictException;
import mx.nomina360.commons.web.error.NotFoundException;
import mx.nomina360.produccion.config.RabbitConfig;
import mx.nomina360.produccion.dominio.CentroTrabajo;
import mx.nomina360.produccion.dominio.EventoOutbox;
import mx.nomina360.produccion.dominio.RegistroHoras;
import mx.nomina360.produccion.dominio.Turno;
import mx.nomina360.produccion.dto.RespuestaCentroTrabajo;
import mx.nomina360.produccion.dto.RespuestaRegistro;
import mx.nomina360.produccion.dto.RespuestaResumenHoras;
import mx.nomina360.produccion.dto.RespuestaTurno;
import mx.nomina360.produccion.dto.SolicitudRegistro;
import mx.nomina360.produccion.dto.SolicitudRegistros;
import mx.nomina360.produccion.repositorio.CentroTrabajoRepository;
import mx.nomina360.produccion.repositorio.EventoOutboxRepository;
import mx.nomina360.produccion.repositorio.RegistroHorasRepository;
import mx.nomina360.produccion.repositorio.TurnoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ProduccionService {

    private static final Logger log = LoggerFactory.getLogger(ProduccionService.class);
    private static final String ESTATUS_REGISTRADO = "REGISTRADO";
    private static final String ESTATUS_APROBADO = "APROBADO";
    private static final String ESTATUS_RECHAZADO = "RECHAZADO";

    private final RegistroHorasRepository registros;
    private final CentroTrabajoRepository centros;
    private final TurnoRepository turnos;
    private final EventoOutboxRepository outbox;
    private final ObjectMapper objectMapper;

    public ProduccionService(RegistroHorasRepository registros,
                             CentroTrabajoRepository centros,
                             TurnoRepository turnos,
                             EventoOutboxRepository outbox,
                             ObjectMapper objectMapper) {
        this.registros = registros;
        this.centros = centros;
        this.turnos = turnos;
        this.outbox = outbox;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public List<RespuestaRegistro> registrar(SolicitudRegistros solicitud) {
        Set<String> vistos = new HashSet<>();
        List<RegistroHoras> entidades = new ArrayList<>();

        for (SolicitudRegistro item : solicitud.registros()) {
            String clave = item.empleadoId() + "|" + item.fecha() + "|" + item.turnoId();
            if (!vistos.add(clave)) {
                throw new ConflictException("Hay registros duplicados para el empleado "
                        + item.empleadoNombre() + " en la fecha " + item.fecha());
            }
            if (registros.existsByEmpleadoIdAndFechaAndTurnoId(item.empleadoId(), item.fecha(), item.turnoId())) {
                throw new ConflictException("Ya existe un registro para " + item.empleadoNombre()
                        + " el " + item.fecha() + " en ese turno");
            }
            if (item.centroTrabajoId() != null && !centros.existsById(item.centroTrabajoId())) {
                throw new BusinessException("CENTRO_INEXISTENTE", "El centro de trabajo no existe",
                        HttpStatus.BAD_REQUEST);
            }
            if (!turnos.existsById(item.turnoId())) {
                throw new BusinessException("TURNO_INEXISTENTE", "El turno no existe", HttpStatus.BAD_REQUEST);
            }

            RegistroHoras registro = new RegistroHoras();
            registro.setEmpleadoId(item.empleadoId());
            registro.setEmpleadoNombre(item.empleadoNombre().trim());
            registro.setCentroTrabajoId(item.centroTrabajoId());
            registro.setTurnoId(item.turnoId());
            registro.setFecha(item.fecha());
            registro.setHorasNormales(item.horasNormales());
            registro.setHorasExtra(item.horasExtra() == null ? BigDecimal.ZERO : item.horasExtra());
            registro.setObservaciones(item.observaciones());
            registro.setEstatus(ESTATUS_REGISTRADO);
            entidades.add(registro);
        }

        return registros.saveAll(entidades).stream().map(RespuestaRegistro::desde).toList();
    }

    /**
     * Aprueba el registro y, si tiene horas extra, encola el evento para RH
     * dentro de la misma transaccion (patron outbox).
     */
    @Transactional
    public RespuestaRegistro aprobar(UUID id, String usuario) {
        RegistroHoras registro = buscar(id);
        if (!ESTATUS_REGISTRADO.equals(registro.getEstatus())) {
            throw new ConflictException("Solo se pueden aprobar registros en estatus REGISTRADO");
        }

        registro.setEstatus(ESTATUS_APROBADO);
        registro.setAprobadoPor(usuario);
        registro.setAprobadoEn(Instant.now());
        registros.save(registro);

        if (registro.getHorasExtra() != null && registro.getHorasExtra().signum() > 0) {
            encolarHorasAprobadas(registro);
        }

        log.info("Registro {} aprobado por {}", id, usuario);
        return RespuestaRegistro.desde(registro);
    }

    @Transactional
    public RespuestaRegistro rechazar(UUID id, String motivo) {
        RegistroHoras registro = buscar(id);
        if (!ESTATUS_REGISTRADO.equals(registro.getEstatus())) {
            throw new ConflictException("Solo se pueden rechazar registros en estatus REGISTRADO");
        }
        registro.setEstatus(ESTATUS_RECHAZADO);
        registro.setObservaciones(motivo);
        return RespuestaRegistro.desde(registros.save(registro));
    }

    @Transactional(readOnly = true)
    public List<RespuestaRegistro> listar(LocalDate fecha, UUID empleadoId, LocalDate desde, LocalDate hasta) {
        List<RegistroHoras> resultado;
        if (fecha != null) {
            resultado = registros.findByFechaOrderByEmpleadoNombreAsc(fecha);
        } else if (empleadoId != null) {
            resultado = registros.findByEmpleadoIdAndFechaBetweenOrderByFechaAsc(empleadoId,
                    desde != null ? desde : LocalDate.now().withDayOfMonth(1),
                    hasta != null ? hasta : LocalDate.now());
        } else {
            resultado = registros.findByFechaBetweenOrderByFechaAsc(
                    desde != null ? desde : LocalDate.now().withDayOfMonth(1),
                    hasta != null ? hasta : LocalDate.now());
        }
        return resultado.stream().map(RespuestaRegistro::desde).toList();
    }

    @Transactional(readOnly = true)
    public RespuestaResumenHoras resumen(UUID empleadoId, LocalDate desde, LocalDate hasta) {
        LocalDate inicio = desde != null ? desde : LocalDate.now().withDayOfMonth(1);
        LocalDate fin = hasta != null ? hasta : LocalDate.now();
        List<RegistroHoras> lista = registros.findByEmpleadoIdAndFechaBetweenOrderByFechaAsc(empleadoId, inicio, fin);

        BigDecimal normales = lista.stream().map(RegistroHoras::getHorasNormales)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal extra = lista.stream().map(RegistroHoras::getHorasExtra)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long aprobados = lista.stream().filter(r -> ESTATUS_APROBADO.equals(r.getEstatus())).count();

        return new RespuestaResumenHoras(empleadoId, inicio, fin, normales, extra, lista.size(), aprobados);
    }

    @Transactional(readOnly = true)
    public List<RespuestaCentroTrabajo> centros() {
        return centros.findAll().stream().map(RespuestaCentroTrabajo::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<RespuestaTurno> turnos() {
        return turnos.findAll().stream().map(RespuestaTurno::desde).toList();
    }

    private RegistroHoras buscar(UUID id) {
        return registros.findById(id).orElseThrow(() -> new NotFoundException("El registro de horas no existe"));
    }

    private void encolarHorasAprobadas(RegistroHoras registro) {
        String eventoId = UUID.randomUUID().toString();
        String centro = registro.getCentroTrabajoId() == null ? null
                : centros.findById(registro.getCentroTrabajoId()).map(CentroTrabajo::getNombre).orElse(null);

        EventoHorasAprobadas evento = new EventoHorasAprobadas(eventoId, registro.getEmpleadoId(),
                registro.getFecha(), registro.getHorasExtra(), centro);

        try {
            EventoOutbox pendiente = new EventoOutbox();
            pendiente.setId(UUID.fromString(eventoId));
            pendiente.setTipo(RabbitConfig.RK_HORAS);
            pendiente.setPayload(objectMapper.writeValueAsString(evento));
            outbox.save(pendiente);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("No se pudo serializar el evento de horas extra", ex);
        }
    }

    /**
     * Contrato publicado a RH (debe coincidir con ConsumidorHorasAprobadas).
     */
    public record EventoHorasAprobadas(
            String eventoId,
            UUID empleadoId,
            LocalDate fecha,
            BigDecimal horasExtra,
            String centroTrabajo) {
    }
}
