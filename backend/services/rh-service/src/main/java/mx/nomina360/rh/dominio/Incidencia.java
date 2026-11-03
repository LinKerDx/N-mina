package mx.nomina360.rh.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "incidencias")
@Getter
@Setter
@NoArgsConstructor
public class Incidencia {

    @Id
    private UUID id;

    @Column(name = "empleado_id", nullable = false)
    private UUID empleadoId;

    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(nullable = false)
    private LocalDate fecha;

    /**
     * Dias para FALTA/VACACIONES/INCAPACIDAD, horas para HORAS_EXTRA y
     * monto para BONO_PRODUCTIVIDAD.
     */
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal cantidad;

    @Column(length = 200)
    private String motivo;

    @Column(nullable = false)
    private Boolean autorizada = true;

    @Column(nullable = false, length = 20)
    private String origen = "MANUAL";

    /**
     * Identificador del evento de origen (idempotencia de integraciones).
     */
    @Column(name = "referencia_externa", unique = true, length = 80)
    private String referenciaExterna;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        creadoEn = Instant.now();
        if (autorizada == null) {
            autorizada = true;
        }
        if (origen == null) {
            origen = "MANUAL";
        }
    }
}
