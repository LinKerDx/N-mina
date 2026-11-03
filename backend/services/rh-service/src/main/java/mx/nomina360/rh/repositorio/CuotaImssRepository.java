package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.CuotaImss;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CuotaImssRepository extends JpaRepository<CuotaImss, Long> {

    List<CuotaImss> findByVigenteDesdeLessThanEqualOrderByVigenteDesdeDesc(LocalDate fecha);
}
