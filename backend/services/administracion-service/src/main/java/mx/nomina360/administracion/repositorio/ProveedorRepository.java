package mx.nomina360.administracion.repositorio;

import mx.nomina360.administracion.dominio.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProveedorRepository extends JpaRepository<Proveedor, UUID> {
}
