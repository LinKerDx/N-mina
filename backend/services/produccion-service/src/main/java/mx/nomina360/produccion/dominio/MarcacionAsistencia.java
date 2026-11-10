package mx.nomina360.produccion.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "marcaciones_asistencia")
@Getter
@Setter
@NoArgsConstructor
public class MarcacionAsistencia {

    @Id
    private UUID id;

    @Column(name = "empleado_id", nullable = false)
    private UUID empleadoId;

    @Column(name = "empleado_nombre", nullable = false, length = 200)
    private String empleadoNombre;

    @Column(name = "numero_empleado", length = 20)
    private String numeroEmpleado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoMarcacion tipo;

    @Column(name = "ocurrido_en", nullable = false)
    private Instant ocurridoEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrigenMarcacion origen;

    @Column(name = "dispositivo_id", length = 100)
    private String dispositivoId;

    @Column(name = "evento_dispositivo_id", length = 160)
    private String eventoDispositivoId;

    @Column(name = "recibido_en", nullable = false)
    private Instant recibidoEn;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (recibidoEn == null) {
            recibidoEn = Instant.now();
        }
    }
}
