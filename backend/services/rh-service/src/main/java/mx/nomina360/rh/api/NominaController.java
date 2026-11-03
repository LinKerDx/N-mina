package mx.nomina360.rh.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.commons.web.api.PageResponse;
import mx.nomina360.rh.dto.RespuestaCalculo;
import mx.nomina360.rh.dto.RespuestaPeriodo;
import mx.nomina360.rh.dto.RespuestaRecibo;
import mx.nomina360.rh.dto.SolicitudPeriodo;
import mx.nomina360.rh.servicio.NominaService;
import org.springframework.data.domain.Page;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rh")
@PreAuthorize("hasAnyRole('ADMIN','RH')")
@Tag(name = "Nomina", description = "Periodos, calculo y recibos de nomina")
public class NominaController {

    private final NominaService servicio;

    public NominaController(NominaService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Lista los periodos de nomina")
    @GetMapping("/periodos")
    public PageResponse<RespuestaPeriodo> listar(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "12") int size) {
        Page<RespuestaPeriodo> resultado = servicio.listarPeriodos(page, size);
        return PageResponse.de(resultado.getContent(), resultado.getNumber(), resultado.getSize(),
                resultado.getTotalElements());
    }

    @Operation(summary = "Crea un periodo de nomina")
    @PostMapping("/periodos")
    @ResponseStatus(HttpStatus.CREATED)
    public RespuestaPeriodo crear(@Valid @RequestBody SolicitudPeriodo solicitud) {
        return servicio.crearPeriodo(solicitud);
    }

    @Operation(summary = "Calcula los recibos del periodo")
    @PostMapping("/periodos/{id}/calcular")
    public RespuestaCalculo calcular(@PathVariable UUID id) {
        return servicio.calcular(id);
    }

    @Operation(summary = "Cierra el periodo calculado")
    @PostMapping("/periodos/{id}/cerrar")
    public RespuestaPeriodo cerrar(@PathVariable UUID id) {
        return servicio.cerrarPeriodo(id);
    }

    @Operation(summary = "Recibos del periodo con sus conceptos")
    @GetMapping("/periodos/{id}/recibos")
    public List<RespuestaRecibo> recibos(@PathVariable UUID id) {
        return servicio.recibosDePeriodo(id);
    }
}
