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

/**
 * Tarifa mensual de ISR por ejercicio (tabla publicada por el SAT).
 */
@Entity
@Table(name = "tarifas_isr")
@Getter
@Setter
@NoArgsConstructor
public class TarifaIsr {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer ejercicio;

    @Column(name = "limite_inferior", nullable = false, precision = 14, scale = 2)
    private BigDecimal limiteInferior;

    @Column(name = "limite_superior", precision = 14, scale = 2)
    private BigDecimal limiteSuperior;

    @Column(name = "cuota_fija", nullable = false, precision = 14, scale = 2)
    private BigDecimal cuotaFija;

    @Column(nullable = false, precision = 6, scale = 4)
    private BigDecimal tasa;
}
