package mx.nomina360.produccion.repositorio;

import mx.nomina360.produccion.dominio.CentroTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CentroTrabajoRepository extends JpaRepository<CentroTrabajo, UUID> {
}
