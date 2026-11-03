package mx.nomina360.produccion.repositorio;

import mx.nomina360.produccion.dominio.Turno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TurnoRepository extends JpaRepository<Turno, UUID> {
}
