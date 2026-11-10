package mx.nomina360.produccion.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.commons.security.UsuarioActual;
import mx.nomina360.produccion.dominio.EventoCalendario;
import mx.nomina360.produccion.dto.RespuestaEventoCalendario;
import mx.nomina360.produccion.dto.SolicitudEventoCalendario;
import mx.nomina360.produccion.repositorio.EventoCalendarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/produccion/eventos-calendario")
@Tag(name = "Calendario", description = "Eventos compartidos y actividades de Recursos Humanos")
public class EventoCalendarioController {
    private final EventoCalendarioRepository eventos;
    public EventoCalendarioController(EventoCalendarioRepository eventos) { this.eventos = eventos; }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lista eventos dentro de un rango de fechas")
    public List<RespuestaEventoCalendario> listar(@RequestParam LocalDate desde, @RequestParam LocalDate hasta) {
        validarRango(desde, hasta);
        return eventos.findByFechaInicioLessThanEqualAndFechaFinGreaterThanEqualOrderByFechaInicioAsc(hasta, desde)
                .stream().map(RespuestaEventoCalendario::desde).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','RH')")
    @Operation(summary = "Crea un evento visible en el calendario de toda la organización")
    public RespuestaEventoCalendario crear(@Valid @RequestBody SolicitudEventoCalendario solicitud) {
        validarRango(solicitud.fechaInicio(), solicitud.fechaFin());
        if (solicitud.fechaFin().isBefore(solicitud.fechaInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha final debe ser igual o posterior a la inicial");
        }
        var usuario = UsuarioActual.requerido();
        EventoCalendario evento = new EventoCalendario();
        evento.setTitulo(solicitud.titulo().trim());
        evento.setDescripcion(solicitud.descripcion() == null ? null : solicitud.descripcion().trim());
        evento.setFechaInicio(solicitud.fechaInicio());
        evento.setFechaFin(solicitud.fechaFin());
        evento.setCreadoPor(usuario.email());
        return RespuestaEventoCalendario.desde(eventos.save(evento));
    }

    private static void validarRango(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null || hasta.isBefore(desde)
                || desde.plusMonths(6).isBefore(hasta)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango debe ser válido y no superar seis meses");
        }
    }
}
