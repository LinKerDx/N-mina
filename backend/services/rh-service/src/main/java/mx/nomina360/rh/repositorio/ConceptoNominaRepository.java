package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.ConceptoNomina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConceptoNominaRepository extends JpaRepository<ConceptoNomina, UUID> {

    List<ConceptoNomina> findByReciboIdOrderByOrdenAsc(UUID reciboId);

    List<ConceptoNomina> findByReciboIdIn(List<UUID> recibosIds);
}
