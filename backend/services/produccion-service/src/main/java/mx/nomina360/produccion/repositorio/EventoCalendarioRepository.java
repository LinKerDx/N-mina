package mx.nomina360.produccion.repositorio;

import mx.nomina360.produccion.dominio.EventoCalendario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EventoCalendarioRepository extends JpaRepository<EventoCalendario, UUID> {
    List<EventoCalendario> findByFechaInicioLessThanEqualAndFechaFinGreaterThanEqualOrderByFechaInicioAsc(
            LocalDate hasta, LocalDate desde);
}
