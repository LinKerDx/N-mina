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
@Table(name = "recibos_nomina")
@Getter
@Setter
@NoArgsConstructor
public class ReciboNomina {

    @Id
    private UUID id;

    @Column(name = "periodo_id", nullable = false)
    private UUID periodoId;

    @Column(name = "empleado_id", nullable = false)
    private UUID empleadoId;

    @Column(name = "numero_empleado", nullable = false, length = 20)
    private String numeroEmpleado;

    @Column(name = "nombre_empleado", nullable = false, length = 200)
    private String nombreEmpleado;

    @Column(name = "dias_pagados", nullable = false, precision = 6, scale = 2)
    private BigDecimal diasPagados;

    @Column(name = "total_percepciones", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPercepciones;

    @Column(name = "total_deducciones", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalDeducciones;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal neto;

    @Column(nullable = false, length = 20)
    private String estatus = "CALCULADO";

    @Column(name = "calculado_en", nullable = false)
    private Instant calculadoEn;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        calculadoEn = Instant.now();
        if (estatus == null) {
            estatus = "CALCULADO";
        }
    }
}
