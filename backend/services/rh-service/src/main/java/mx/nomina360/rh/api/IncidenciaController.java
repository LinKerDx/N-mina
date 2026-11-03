package mx.nomina360.rh.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.rh.dto.RespuestaIncidencia;
import mx.nomina360.rh.dto.SolicitudIncidencia;
import mx.nomina360.rh.servicio.IncidenciaService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
@Tag(name = "Incidencias", description = "Faltas, horas extra, vacaciones y bonos")
public class IncidenciaController {

    private final IncidenciaService servicio;

    public IncidenciaController(IncidenciaService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Registra una incidencia")
    @PostMapping("/incidencias")
    @ResponseStatus(HttpStatus.CREATED)
    public RespuestaIncidencia crear(@Valid @RequestBody SolicitudIncidencia solicitud) {
        return servicio.crear(solicitud);
    }

    @Operation(summary = "Lista incidencias por empleado y rango de fechas")
    @GetMapping("/incidencias")
    public List<RespuestaIncidencia> listar(@RequestParam(required = false) UUID empleadoId,
                                            @RequestParam(required = false) LocalDate desde,
                                            @RequestParam(required = false) LocalDate hasta) {
        return servicio.listar(empleadoId, desde, hasta);
    }
}
