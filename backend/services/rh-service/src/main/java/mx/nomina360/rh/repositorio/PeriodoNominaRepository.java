package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.PeriodoNomina;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface PeriodoNominaRepository extends JpaRepository<PeriodoNomina, UUID> {

    Page<PeriodoNomina> findAllByOrderByFechaInicioDesc(Pageable pageable);

    boolean existsByTipoAndFechaInicio(String tipo, LocalDate fechaInicio);

    Optional<PeriodoNomina> findTopByOrderByFechaInicioDesc();

    long countByEstatus(String estatus);
}
