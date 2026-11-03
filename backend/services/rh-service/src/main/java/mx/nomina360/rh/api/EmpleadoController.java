package mx.nomina360.rh.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.commons.web.api.PageResponse;
import mx.nomina360.rh.dto.RespuestaDepartamento;
import mx.nomina360.rh.dto.RespuestaEmpleado;
import mx.nomina360.rh.dto.RespuestaPuesto;
import mx.nomina360.rh.dto.SolicitudEmpleado;
import mx.nomina360.rh.servicio.EmpleadoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rh")
@PreAuthorize("hasAnyRole('ADMIN','RH')")
@Tag(name = "Empleados", description = "Catalogo y administracion de empleados")
public class EmpleadoController {

    private final EmpleadoService servicio;

    public EmpleadoController(EmpleadoService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Busca empleados por texto y estatus")
    @GetMapping("/empleados")
    public PageResponse<RespuestaEmpleado> buscar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return servicio.buscar(q, estatus, page, size);
    }

    @Operation(summary = "Obtiene un empleado por id")
    @GetMapping("/empleados/{id}")
    public RespuestaEmpleado obtener(@PathVariable UUID id) {
        return servicio.obtener(id);
    }

    @Operation(summary = "Alta de empleado")
    @PostMapping("/empleados")
    @ResponseStatus(HttpStatus.CREATED)
    public RespuestaEmpleado crear(@Valid @RequestBody SolicitudEmpleado solicitud) {
        return servicio.crear(solicitud);
    }

    @Operation(summary = "Actualiza un empleado")
    @PutMapping("/empleados/{id}")
    public RespuestaEmpleado actualizar(@PathVariable UUID id, @Valid @RequestBody SolicitudEmpleado solicitud) {
        return servicio.actualizar(id, solicitud);
    }

    @Operation(summary = "Baja logica de un empleado")
    @DeleteMapping("/empleados/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void darDeBaja(@PathVariable UUID id, @RequestParam(required = false) LocalDate fechaBaja) {
        servicio.darDeBaja(id, fechaBaja);
    }

    @Operation(summary = "Catalogo de departamentos")
    @GetMapping("/departamentos")
    public List<RespuestaDepartamento> departamentos() {
        return servicio.listarDepartamentos();
    }

    @Operation(summary = "Catalogo de puestos")
    @GetMapping("/puestos")
    public List<RespuestaPuesto> puestos() {
        return servicio.listarPuestos();
    }
}
