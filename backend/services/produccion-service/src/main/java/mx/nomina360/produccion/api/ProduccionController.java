package mx.nomina360.produccion.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.commons.security.UsuarioActual;
import mx.nomina360.produccion.dto.RespuestaCentroTrabajo;
import mx.nomina360.produccion.dto.RespuestaRegistro;
import mx.nomina360.produccion.dto.RespuestaResumenHoras;
import mx.nomina360.produccion.dto.RespuestaTurno;
import mx.nomina360.produccion.dto.SolicitudRegistros;
import mx.nomina360.produccion.servicio.ProduccionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
@RequestMapping("/api/produccion")
@PreAuthorize("hasAnyRole('ADMIN','PRODUCCION')")
@Tag(name = "Produccion", description = "Registro de horas y aprobacion de tiempo extra")
public class ProduccionController {

    private final ProduccionService servicio;

    public ProduccionController(ProduccionService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Registra horas trabajadas (lote)")
    @PostMapping("/registros")
    @ResponseStatus(HttpStatus.CREATED)
    public List<RespuestaRegistro> registrar(@Valid @RequestBody SolicitudRegistros solicitud) {
        return servicio.registrar(solicitud);
    }

    @Operation(summary = "Aprueba un registro y notifica las horas extra a RH")
    @PostMapping("/registros/{id}/aprobar")
    public RespuestaRegistro aprobar(@PathVariable UUID id) {
        return servicio.aprobar(id, UsuarioActual.requerido().email());
    }

    @Operation(summary = "Rechaza un registro")
    @PostMapping("/registros/{id}/rechazar")
    public RespuestaRegistro rechazar(@PathVariable UUID id, @RequestParam String motivo) {
        return servicio.rechazar(id, motivo);
    }

    @Operation(summary = "Lista registros por fecha o rango")
    @GetMapping("/registros")
    public List<RespuestaRegistro> listar(@RequestParam(required = false) LocalDate fecha,
                                          @RequestParam(required = false) UUID empleadoId,
                                          @RequestParam(required = false) LocalDate desde,
                                          @RequestParam(required = false) LocalDate hasta) {
        return servicio.listar(fecha, empleadoId, desde, hasta);
    }

    @Operation(summary = "Resumen de horas por empleado y rango")
    @GetMapping("/resumen")
    public RespuestaResumenHoras resumen(@RequestParam UUID empleadoId,
                                         @RequestParam(required = false) LocalDate desde,
                                         @RequestParam(required = false) LocalDate hasta) {
        return servicio.resumen(empleadoId, desde, hasta);
    }

    @Operation(summary = "Catalogo de centros de trabajo")
    @GetMapping("/centros-trabajo")
    public List<RespuestaCentroTrabajo> centros() {
        return servicio.centros();
    }

    @Operation(summary = "Catalogo de turnos")
    @GetMapping("/turnos")
    public List<RespuestaTurno> turnos() {
        return servicio.turnos();
    }
}
