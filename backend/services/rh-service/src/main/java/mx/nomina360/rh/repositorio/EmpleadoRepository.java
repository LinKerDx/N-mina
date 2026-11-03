package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface EmpleadoRepository extends JpaRepository<Empleado, UUID>, JpaSpecificationExecutor<Empleado> {

    List<Empleado> findByEstatus(String estatus);

    long countByEstatus(String estatus);

    boolean existsByNumeroEmpleado(String numeroEmpleado);

    boolean existsByNumeroEmpleadoAndIdNot(String numeroEmpleado, UUID id);
}
