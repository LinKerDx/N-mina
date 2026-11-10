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
import java.util.UUID;

@Entity
@Table(name = "ajustes_nomina")
@Getter
@Setter
@NoArgsConstructor
public class AjusteNomina {

    @Id
    private UUID id;

    @Column(name = "periodo_id", nullable = false)
    private UUID periodoId;

    @Column(name = "empleado_id", nullable = false)
    private UUID empleadoId;

    @Column(nullable = false, length = 15)
    private String tipo;

    @Column(nullable = false, length = 120)
    private String descripcion;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal importe;

    @Column(nullable = false)
    private Boolean gravable = false;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @PrePersist
    void alCrear() {
        if (id == null) id = UUID.randomUUID();
        if (creadoEn == null) creadoEn = Instant.now();
        if (gravable == null) gravable = false;
    }
}
