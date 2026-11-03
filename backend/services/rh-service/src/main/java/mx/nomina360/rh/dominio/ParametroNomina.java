package mx.nomina360.rh.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Parametros legales/configurables del motor de nomina.
 */
@Entity
@Table(name = "parametros_nomina")
@Getter
@Setter
@NoArgsConstructor
public class ParametroNomina {

    @Id
    @Column(length = 60)
    private String clave;

    @Column(nullable = false, precision = 14, scale = 4)
    private BigDecimal valor;

    @Column(nullable = false, length = 200)
    private String descripcion;
}
