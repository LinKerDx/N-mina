package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.ReciboNomina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ReciboNominaRepository extends JpaRepository<ReciboNomina, UUID> {

    List<ReciboNomina> findByPeriodoIdOrderByNombreEmpleadoAsc(UUID periodoId);

    long countByPeriodoId(UUID periodoId);

    void deleteByPeriodoId(UUID periodoId);

    @Query("select coalesce(sum(r.totalPercepciones), 0) from ReciboNomina r where r.periodoId = :periodoId")
    BigDecimal sumaPercepciones(@Param("periodoId") UUID periodoId);

    @Query("select coalesce(sum(r.totalDeducciones), 0) from ReciboNomina r where r.periodoId = :periodoId")
    BigDecimal sumaDeducciones(@Param("periodoId") UUID periodoId);

    @Query("select coalesce(sum(r.neto), 0) from ReciboNomina r where r.periodoId = :periodoId")
    BigDecimal sumaNeto(@Param("periodoId") UUID periodoId);
}
