package mx.nomina360.produccion.repositorio;

import mx.nomina360.produccion.dominio.RegistroHoras;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RegistroHorasRepository extends JpaRepository<RegistroHoras, UUID> {

    List<RegistroHoras> findByFechaOrderByEmpleadoNombreAsc(LocalDate fecha);

    List<RegistroHoras> findByFechaBetweenOrderByFechaAsc(LocalDate desde, LocalDate hasta);

    List<RegistroHoras> findByEmpleadoIdAndFechaBetweenOrderByFechaAsc(UUID empleadoId, LocalDate desde, LocalDate hasta);

    boolean existsByEmpleadoIdAndFechaAndTurnoId(UUID empleadoId, LocalDate fecha, UUID turnoId);

    long countByEstatus(String estatus);
}
