package mx.nomina360.produccion.dominio;

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
@Table(name = "eventos_calendario")
@Getter
@Setter
@NoArgsConstructor
public class EventoCalendario {
    @Id private UUID id;
    @Column(nullable = false, length = 120) private String titulo;
    @Column(length = 500) private String descripcion;
    @Column(name = "fecha_inicio", nullable = false) private LocalDate fechaInicio;
    @Column(name = "fecha_fin", nullable = false) private LocalDate fechaFin;
    @Column(name = "creado_por", nullable = false, length = 160) private String creadoPor;
    @Column(name = "creado_en", nullable = false) private Instant creadoEn;

    @PrePersist void alCrear() {
        if (id == null) id = UUID.randomUUID();
        if (creadoEn == null) creadoEn = Instant.now();
    }
}
