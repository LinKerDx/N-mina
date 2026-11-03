package mx.nomina360.produccion.dominio;

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
@Table(name = "registros_horas")
@Getter
@Setter
@NoArgsConstructor
public class RegistroHoras {

    @Id
    private UUID id;

    @Column(name = "empleado_id", nullable = false)
    private UUID empleadoId;

    @Column(name = "empleado_nombre", nullable = false, length = 200)
    private String empleadoNombre;

    @Column(name = "centro_trabajo_id")
    private UUID centroTrabajoId;

    @Column(name = "turno_id")
    private UUID turnoId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "horas_normales", nullable = false, precision = 5, scale = 2)
    private BigDecimal horasNormales = BigDecimal.ZERO;

    @Column(name = "horas_extra", nullable = false, precision = 5, scale = 2)
    private BigDecimal horasExtra = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String estatus = "REGISTRADO";

    @Column(name = "aprobado_por", length = 160)
    private String aprobadoPor;

    @Column(name = "aprobado_en")
    private Instant aprobadoEn;

    @Column(length = 200)
    private String observaciones;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        creadoEn = Instant.now();
        if (estatus == null) {
            estatus = "REGISTRADO";
        }
        if (horasNormales == null) {
            horasNormales = BigDecimal.ZERO;
        }
        if (horasExtra == null) {
            horasExtra = BigDecimal.ZERO;
        }
    }
}
