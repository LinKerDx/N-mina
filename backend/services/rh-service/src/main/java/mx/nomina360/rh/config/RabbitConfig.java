package mx.nomina360.rh.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Topologia de mensajeria: produccion publica horas aprobadas y RH las consume
 * como incidencias. Los mensajes fallidos terminan en una dead-letter queue.
 */
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "nomina.eventos";
    public static final String EXCHANGE_DLX = "nomina.eventos.dlx";
    public static final String COLA_HORAS = "rh.horas-aprobadas";
    public static final String COLA_HORAS_DLQ = "rh.horas-aprobadas.dlq";
    public static final String RK_HORAS = "produccion.horas.aprobadas";

    @Bean
    public TopicExchange exchangeEventos() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public FanoutExchange exchangeMuertos() {
        return new FanoutExchange(EXCHANGE_DLX, true, false);
    }

    @Bean
    public Queue colaHorasAprobadas() {
        return QueueBuilder.durable(COLA_HORAS)
                .withArgument("x-dead-letter-exchange", EXCHANGE_DLX)
                .withArgument("x-dead-letter-routing-key", COLA_HORAS_DLQ)
                .build();
    }

    @Bean
    public Queue colaHorasAprobadasDlq() {
        return QueueBuilder.durable(COLA_HORAS_DLQ).build();
    }

    @Bean
    public Binding bindingHorasAprobadas(Queue colaHorasAprobadas, TopicExchange exchangeEventos) {
        return BindingBuilder.bind(colaHorasAprobadas).to(exchangeEventos).with(RK_HORAS);
    }

    @Bean
    public Binding bindingDlq(Queue colaHorasAprobadasDlq, FanoutExchange exchangeMuertos) {
        return BindingBuilder.bind(colaHorasAprobadasDlq).to(exchangeMuertos);
    }
}
