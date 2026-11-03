package mx.nomina360.produccion.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Patron transaccional outbox: el evento se guarda en la misma transaccion que el
 * cambio de negocio y un publicador lo envia despues a RabbitMQ.
 */
@Entity
@Table(name = "evento_outbox")
@Getter
@Setter
@NoArgsConstructor
public class EventoOutbox {

    @Id
    private UUID id;

    @Column(nullable = false, length = 80)
    private String tipo;

    @Column(nullable = false, length = 4000)
    private String payload;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "publicado_en")
    private Instant publicadoEn;

    @Column(nullable = false)
    private Integer intentos = 0;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        creadoEn = Instant.now();
        if (intentos == null) {
            intentos = 0;
        }
    }
}
