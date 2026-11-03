package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.Incidencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface IncidenciaRepository extends JpaRepository<Incidencia, UUID> {

    List<Incidencia> findByFechaBetweenOrderByFechaAsc(LocalDate desde, LocalDate hasta);

    List<Incidencia> findByEmpleadoIdAndFechaBetweenOrderByFechaAsc(UUID empleadoId, LocalDate desde, LocalDate hasta);

    boolean existsByReferenciaExterna(String referenciaExterna);
}
