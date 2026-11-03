package mx.nomina360.rh.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Cuota obrera del IMSS (porcentaje sobre el SBC). Valores de referencia:
 * validalos con el IMSS antes de timbrar nomina real.
 */
@Entity
@Table(name = "cuotas_imss")
@Getter
@Setter
@NoArgsConstructor
public class CuotaImss {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String concepto;

    @Column(name = "tasa_obrera", nullable = false, precision = 6, scale = 4)
    private BigDecimal tasaObrera;

    @Column(name = "vigente_desde", nullable = false)
    private LocalDate vigenteDesde;

    @Column(length = 200)
    private String nota;
}
