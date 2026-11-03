package mx.nomina360.rh.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import mx.nomina360.rh.dto.RespuestaEmpleadoResumen;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Catalogo compartido con Produccion para capturar horas sin exponer datos
 * sensibles (CURP, RFC, salario).
 */
@RestController
@RequestMapping("/api/rh")
@Tag(name = "Catalogo de empleados", description = "Vista minima para otras areas")
public class CatalogoEmpleadosController {

    private final EmpleadoRepository empleados;

    public CatalogoEmpleadosController(EmpleadoRepository empleados) {
        this.empleados = empleados;
    }

    @Operation(summary = "Empleados activos (id, numero y nombre)")
    @GetMapping("/empleados/activos")
    @PreAuthorize("hasAnyRole('ADMIN','RH','PRODUCCION')")
    public List<RespuestaEmpleadoResumen> activos() {
        return empleados.findByEstatus("ACTIVO").stream()
                .map(RespuestaEmpleadoResumen::desde)
                .toList();
    }
}
