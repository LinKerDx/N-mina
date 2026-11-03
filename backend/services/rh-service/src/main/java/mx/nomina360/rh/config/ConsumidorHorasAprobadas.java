package mx.nomina360.rh.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import mx.nomina360.rh.dominio.EventoProcesado;
import mx.nomina360.rh.dominio.Incidencia;
import mx.nomina360.rh.nomina.TiposIncidencia;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import mx.nomina360.rh.repositorio.EventoProcesadoRepository;
import mx.nomina360.rh.repositorio.IncidenciaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Consume las horas extra aprobadas en Produccion y las registra como incidencias
 * de RH. Es idempotente por {@code eventoId}.
 */
@Component
public class ConsumidorHorasAprobadas {

    private static final Logger log = LoggerFactory.getLogger(ConsumidorHorasAprobadas.class);
    private static final String ORIGEN = "produccion";

    private final ObjectMapper objectMapper;
    private final IncidenciaRepository incidencias;
    private final EmpleadoRepository empleados;
    private final EventoProcesadoRepository eventos;

    public ConsumidorHorasAprobadas(ObjectMapper objectMapper,
                                    IncidenciaRepository incidencias,
                                    EmpleadoRepository empleados,
                                    EventoProcesadoRepository eventos) {
        this.objectMapper = objectMapper;
        this.incidencias = incidencias;
        this.empleados = empleados;
        this.eventos = eventos;
    }

    @RabbitListener(queues = RabbitConfig.COLA_HORAS)
    @Transactional
    public void recibir(String json) {
        EventoHorasAprobadas evento;
        try {
            evento = objectMapper.readValue(json, EventoHorasAprobadas.class);
        } catch (JsonProcessingException ex) {
            throw new AmqpRejectAndDontRequeueException("Payload de horas invalido", ex);
        }

        if (eventos.existsById(evento.eventoId())) {
            log.info("Evento de horas {} ya procesado, se ignora", evento.eventoId());
            return;
        }

        if (!empleados.existsById(evento.empleadoId())) {
            log.warn("Evento {} referencia un empleado inexistente {}; se descarta",
                    evento.eventoId(), evento.empleadoId());
            registrarProcesado(evento.eventoId());
            return;
        }

        Incidencia incidencia = new Incidencia();
        incidencia.setEmpleadoId(evento.empleadoId());
        incidencia.setTipo(TiposIncidencia.HORAS_EXTRA);
        incidencia.setFecha(evento.fecha());
        incidencia.setCantidad(evento.horasExtra());
        incidencia.setMotivo("Horas aprobadas en Produccion"
                + (evento.centroTrabajo() == null ? "" : " (" + evento.centroTrabajo() + ")"));
        incidencia.setAutorizada(true);
        incidencia.setOrigen(ORIGEN);
        incidencia.setReferenciaExterna(evento.eventoId());
        incidencias.save(incidencia);

        registrarProcesado(evento.eventoId());
        log.info("Horas extra integradas a RH: empleado={} horas={} evento={}",
                evento.empleadoId(), evento.horasExtra(), evento.eventoId());
    }

    private void registrarProcesado(String eventoId) {
        EventoProcesado procesado = new EventoProcesado();
        procesado.setId(eventoId);
        procesado.setOrigen(ORIGEN);
        procesado.setProcesadoEn(Instant.now());
        eventos.save(procesado);
    }

    /**
     * Contrato del evento publicado por produccion-service.
     */
    public record EventoHorasAprobadas(
            String eventoId,
            UUID empleadoId,
            LocalDate fecha,
            BigDecimal horasExtra,
            String centroTrabajo) {
    }
}
