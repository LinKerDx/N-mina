package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.TarifaIsr;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TarifaIsrRepository extends JpaRepository<TarifaIsr, Long> {

    List<TarifaIsr> findByEjercicioOrderByLimiteInferiorAsc(Integer ejercicio);

    @Query("select max(t.ejercicio) from TarifaIsr t")
    Optional<Integer> maxEjercicio();
}
