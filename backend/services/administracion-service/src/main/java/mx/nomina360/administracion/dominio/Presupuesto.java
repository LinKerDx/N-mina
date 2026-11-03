package mx.nomina360.administracion.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "presupuestos")
@Getter
@Setter
@NoArgsConstructor
public class Presupuesto {

    @Id
    private UUID id;

    @Column(name = "centro_costo_id", nullable = false)
    private UUID centroCostoId;

    @Column(nullable = false)
    private Integer ejercicio;

    @Column(nullable = false)
    private Integer mes;

    @Column(name = "monto_presupuestado", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoPresupuestado;

    @Column(name = "monto_ejercido", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoEjercido = BigDecimal.ZERO;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (montoEjercido == null) {
            montoEjercido = BigDecimal.ZERO;
        }
    }
}
