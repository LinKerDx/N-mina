package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.Puesto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PuestoRepository extends JpaRepository<Puesto, UUID> {
}
