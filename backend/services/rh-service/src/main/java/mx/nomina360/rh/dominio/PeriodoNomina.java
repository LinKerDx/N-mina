package mx.nomina360.rh.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "periodos_nomina")
@Getter
@Setter
@NoArgsConstructor
public class PeriodoNomina {

    @Id
    private UUID id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 20)
    private String tipo = "MENSUAL";

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @Column(name = "dias_periodo", nullable = false)
    private Integer diasPeriodo;

    @Column(nullable = false, length = 20)
    private String estatus = "BORRADOR";

    @Column(name = "calculado_en")
    private Instant calculadoEn;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        creadoEn = Instant.now();
        if (estatus == null) {
            estatus = "BORRADOR";
        }
    }

    public boolean esCalculable() {
        return "BORRADOR".equals(estatus);
    }
}
