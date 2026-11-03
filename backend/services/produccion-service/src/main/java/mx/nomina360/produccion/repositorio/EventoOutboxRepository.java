package mx.nomina360.produccion.repositorio;

import mx.nomina360.produccion.dominio.EventoOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventoOutboxRepository extends JpaRepository<EventoOutbox, UUID> {

    List<EventoOutbox> findTop50ByPublicadoEnIsNullOrderByCreadoEnAsc();
}
