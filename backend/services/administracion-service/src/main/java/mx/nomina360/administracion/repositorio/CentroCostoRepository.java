package mx.nomina360.administracion.repositorio;

import mx.nomina360.administracion.dominio.CentroCosto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CentroCostoRepository extends JpaRepository<CentroCosto, UUID> {
}
