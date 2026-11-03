package mx.nomina360.produccion.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "centros_trabajo")
@Getter
@Setter
@NoArgsConstructor
public class CentroTrabajo {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(name = "capacidad_diaria", nullable = false)
    private Integer capacidadDiaria = 10;

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
        if (capacidadDiaria == null) {
            capacidadDiaria = 10;
        }
    }
}
