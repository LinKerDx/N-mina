package mx.nomina360.administracion.repositorio;

import jakarta.persistence.LockModeType;
import mx.nomina360.administracion.dominio.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, UUID> {

    List<Presupuesto> findByEjercicioOrderByCentroCostoIdAscMesAsc(Integer ejercicio);

    Optional<Presupuesto> findByCentroCostoIdAndEjercicioAndMes(UUID centroCostoId, Integer ejercicio, Integer mes);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Presupuesto p where p.centroCostoId = :centroCostoId and p.ejercicio = :ejercicio and p.mes = :mes")
    Optional<Presupuesto> bloquear(@Param("centroCostoId") UUID centroCostoId,
                                   @Param("ejercicio") Integer ejercicio,
                                   @Param("mes") Integer mes);

    @Query("select coalesce(sum(p.montoPresupuestado), 0) from Presupuesto p where p.ejercicio = :ejercicio")
    BigDecimal totalPresupuestado(@Param("ejercicio") Integer ejercicio);

    @Query("select coalesce(sum(p.montoEjercido), 0) from Presupuesto p where p.ejercicio = :ejercicio")
    BigDecimal totalEjercido(@Param("ejercicio") Integer ejercicio);
}
