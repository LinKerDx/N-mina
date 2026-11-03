package mx.nomina360.produccion.config;

import mx.nomina360.produccion.dominio.EventoOutbox;
import mx.nomina360.produccion.repositorio.EventoOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Publica los eventos pendientes del outbox. Reintenta en cada ciclo hasta que
 * RabbitMQ este disponible; si el broker cae, los eventos quedan en la tabla.
 */
@Component
public class PublicadorOutbox {

    private static final Logger log = LoggerFactory.getLogger(PublicadorOutbox.class);

    private final EventoOutboxRepository outbox;
    private final RabbitTemplate rabbitTemplate;

    public PublicadorOutbox(EventoOutboxRepository outbox, RabbitTemplate rabbitTemplate) {
        this.outbox = outbox;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Scheduled(fixedDelayString = "${nomina.outbox.intervalo-ms:5000}")
    @Transactional
    public void publicarPendientes() {
        for (EventoOutbox evento : outbox.findTop50ByPublicadoEnIsNullOrderByCreadoEnAsc()) {
            try {
                rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, evento.getTipo(), evento.getPayload());
                evento.setPublicadoEn(Instant.now());
            } catch (RuntimeException ex) {
                evento.setIntentos(evento.getIntentos() + 1);
                log.warn("No se pudo publicar el evento {} (intento {}): {}",
                        evento.getId(), evento.getIntentos(), ex.getMessage());
            }
            outbox.save(evento);
        }
    }
}
