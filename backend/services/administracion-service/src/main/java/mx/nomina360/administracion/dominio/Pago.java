package mx.nomina360.administracion.dominio;

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
@Table(name = "pagos")
@Getter
@Setter
@NoArgsConstructor
public class Pago {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String folio;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "referencia_externa", length = 80)
    private String referenciaExterna;

    @Column(name = "proveedor_id")
    private UUID proveedorId;

    @Column(name = "centro_costo_id", nullable = false)
    private UUID centroCostoId;

    /**
     * Referencia blanda al periodo de nomina de rh-service (sin FK entre bases).
     */
    @Column(name = "periodo_nomina_id")
    private UUID periodoNominaId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false, length = 3)
    private String moneda = "MXN";

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @Column(nullable = false, length = 20)
    private String estatus = "PAGADO";

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        creadoEn = Instant.now();
        if (moneda == null) {
            moneda = "MXN";
        }
        if (estatus == null) {
            estatus = "PAGADO";
        }
    }
}
