package mx.nomina360.rh.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "empleados")
@Getter
@Setter
@NoArgsConstructor
public class Empleado {

    @Id
    private UUID id;

    @Column(name = "numero_empleado", nullable = false, unique = true, length = 20)
    private String numeroEmpleado;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(name = "apellido_paterno", nullable = false, length = 80)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", length = 80)
    private String apellidoMaterno;

    @Column(length = 18)
    private String curp;

    @Column(length = 13)
    private String rfc;

    @Column(length = 15)
    private String nss;

    @Column(length = 160)
    private String email;

    @Column(length = 20)
    private String telefono;

    @Column(name = "departamento_id")
    private UUID departamentoId;

    @Column(name = "puesto_id")
    private UUID puestoId;

    @Column(name = "tipo_contrato", nullable = false, length = 30)
    private String tipoContrato = "INDEFINIDO";

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;

    @Column(name = "fecha_baja")
    private LocalDate fechaBaja;

    @Column(name = "salario_diario", nullable = false, precision = 12, scale = 2)
    private BigDecimal salarioDiario;

    @Column(nullable = false, length = 20)
    private String estatus = "ACTIVO";

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    @PrePersist
    void alCrear() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant ahora = Instant.now();
        creadoEn = ahora;
        actualizadoEn = ahora;
        if (estatus == null) {
            estatus = "ACTIVO";
        }
        if (tipoContrato == null) {
            tipoContrato = "INDEFINIDO";
        }
    }

    @PreUpdate
    void alActualizar() {
        actualizadoEn = Instant.now();
    }

    public String nombreCompleto() {
        return (nombre + " " + apellidoPaterno + (apellidoMaterno == null ? "" : " " + apellidoMaterno)).trim();
    }
}
