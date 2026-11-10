package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.AjusteNomina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AjusteNominaRepository extends JpaRepository<AjusteNomina, UUID> {

    List<AjusteNomina> findByPeriodoIdOrderByCreadoEnAsc(UUID periodoId);

    List<AjusteNomina> findByPeriodoIdAndEmpleadoId(UUID periodoId, UUID empleadoId);
}
