package mx.nomina360.produccion.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.produccion.dto.RespuestaMarcacion;
import mx.nomina360.produccion.dto.SolicitudMarcacion;
import mx.nomina360.produccion.servicio.MarcacionAsistenciaService;
import mx.nomina360.commons.security.UsuarioActual;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/produccion/marcaciones")
@Tag(name = "Asistencia", description = "Entrada, comida y salida de turno normalizadas para checadores")
public class MarcacionAsistenciaController {

    private final MarcacionAsistenciaService servicio;

    public MarcacionAsistenciaController(MarcacionAsistenciaService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Recibe una marcación normalizada de un dispositivo")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PRODUCCION')")
    @ResponseStatus(HttpStatus.CREATED)
    public RespuestaMarcacion recibir(@Valid @RequestBody SolicitudMarcacion solicitud) {
        return servicio.recibir(solicitud);
    }

    @Operation(summary = "Lista marcaciones de un empleado en un intervalo UTC")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PRODUCCION')")
    public List<RespuestaMarcacion> listar(
            @RequestParam UUID empleadoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta) {
        return servicio.listar(empleadoId, desde, hasta);
    }

    @Operation(summary = "Lista únicamente las marcaciones del empleado autenticado")
    @GetMapping("/mias")
    @PreAuthorize("hasAnyRole('ADMIN','RH','PRODUCCION','ADMINISTRACION','EMPLEADO')")
    public List<RespuestaMarcacion> listarPropias(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta) {
        if (hasta.isBefore(desde)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha final debe ser posterior a la inicial");
        }
        if (desde.plusSeconds(366L * 24 * 60 * 60).isBefore(hasta)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El intervalo no puede superar 366 días");
        }
        String numeroEmpleado = UsuarioActual.requerido().numeroEmpleado();
        if (numeroEmpleado == null || numeroEmpleado.isBlank()) {
            return List.of();
        }
        return servicio.listarPropias(numeroEmpleado, desde, hasta);
    }
}
