package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.EventoProcesado;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventoProcesadoRepository extends JpaRepository<EventoProcesado, String> {
}
