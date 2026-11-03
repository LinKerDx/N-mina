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
import java.util.UUID;

@Entity
@Table(name = "conceptos_nomina")
@Getter
@Setter
@NoArgsConstructor
public class ConceptoNomina {

    @Id
    private UUID id;

    @Column(name = "recibo_id", nullable = false)
    private UUID reciboId;

    @Column(nullable = false, length = 15)
    private String tipo;

    @Column(nullable = false, length = 20)
    private String clave;

    @Column(nullable = false, length = 120)
    private String descripcion;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal importe;

    @Column(nullable = false)
    private Boolean gravable = true;

    @Column(nullable = false)
    private Integer orden = 0;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (gravable == null) {
            gravable = true;
        }
        if (orden == null) {
            orden = 0;
        }
    }
}
