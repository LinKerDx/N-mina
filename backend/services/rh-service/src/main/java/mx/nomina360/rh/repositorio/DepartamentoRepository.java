package mx.nomina360.rh.repositorio;

import mx.nomina360.rh.dominio.Departamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DepartamentoRepository extends JpaRepository<Departamento, UUID> {
}
