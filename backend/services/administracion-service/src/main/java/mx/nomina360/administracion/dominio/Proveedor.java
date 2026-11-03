package mx.nomina360.administracion.dominio;

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
@Table(name = "proveedores")
@Getter
@Setter
@NoArgsConstructor
public class Proveedor {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 13)
    private String rfc;

    @Column(name = "razon_social", nullable = false, length = 200)
    private String razonSocial;

    @Column(length = 160)
    private String email;

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
    }
}
