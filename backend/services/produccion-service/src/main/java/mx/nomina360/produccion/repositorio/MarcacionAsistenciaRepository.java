package mx.nomina360.produccion.repositorio;

import mx.nomina360.produccion.dominio.MarcacionAsistencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarcacionAsistenciaRepository extends JpaRepository<MarcacionAsistencia, UUID> {

    Optional<MarcacionAsistencia> findByDispositivoIdAndEventoDispositivoId(
            String dispositivoId, String eventoDispositivoId);

    List<MarcacionAsistencia> findByEmpleadoIdAndOcurridoEnBetweenOrderByOcurridoEnAsc(
            UUID empleadoId, Instant desde, Instant hasta);
}
