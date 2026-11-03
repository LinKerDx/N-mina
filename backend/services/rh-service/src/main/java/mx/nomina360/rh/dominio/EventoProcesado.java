package mx.nomina360.rh.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Registro de eventos ya integrados (idempotencia de consumidores).
 */
@Entity
@Table(name = "eventos_procesados")
@Getter
@Setter
@NoArgsConstructor
public class EventoProcesado {

    @Id
    @Column(length = 80)
    private String id;

    @Column(nullable = false, length = 40)
    private String origen;

    @Column(name = "procesado_en", nullable = false)
    private Instant procesadoEn = Instant.now();
}
