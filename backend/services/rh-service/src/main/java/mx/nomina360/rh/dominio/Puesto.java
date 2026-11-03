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
@Table(name = "puestos")
@Getter
@Setter
@NoArgsConstructor
public class Puesto {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 120)
    private String nombre;

    @Column(name = "departamento_id")
    private UUID departamentoId;

    @Column(name = "salario_base_diario", nullable = false, precision = 12, scale = 2)
    private BigDecimal salarioBaseDiario;

    @Column(nullable = false)
    private Integer nivel = 1;

    @Column(nullable = false)
    private Boolean activo = true;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (activo == null) {
            activo = true;
        }
        if (nivel == null) {
            nivel = 1;
        }
    }
}
