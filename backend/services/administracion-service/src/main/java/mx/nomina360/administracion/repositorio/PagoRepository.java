package mx.nomina360.administracion.repositorio;

import mx.nomina360.administracion.dominio.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PagoRepository extends JpaRepository<Pago, UUID> {

    List<Pago> findByFechaPagoBetweenOrderByFechaPagoDesc(LocalDate desde, LocalDate hasta);

    boolean existsByFolio(String folio);

    long countByFechaPagoBetween(LocalDate desde, LocalDate hasta);

    @Query("select coalesce(sum(p.monto), 0) from Pago p where p.fechaPago between :desde and :hasta")
    BigDecimal totalPagado(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
