package mx.nomina360.rh.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.rh.dto.RespuestaAjusteNomina;
import mx.nomina360.rh.dto.SolicitudAjusteNomina;
import mx.nomina360.rh.servicio.AjusteNominaService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rh")
@PreAuthorize("hasAnyRole('ADMIN','RH','ADMINISTRACION')")
@Tag(name = "Ajustes de nómina", description = "Percepciones y deducciones manuales de periodos en borrador")
public class AjusteNominaController {

    private final AjusteNominaService servicio;

    public AjusteNominaController(AjusteNominaService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Lista los conceptos manuales de un periodo")
    @GetMapping("/periodos/{periodoId}/ajustes")
    public List<RespuestaAjusteNomina> listar(@PathVariable UUID periodoId) {
        return servicio.listar(periodoId);
    }

    @Operation(summary = "Agrega una percepción o deducción a un periodo en borrador")
    @PostMapping("/periodos/{periodoId}/ajustes")
    @ResponseStatus(HttpStatus.CREATED)
    public RespuestaAjusteNomina crear(@PathVariable UUID periodoId,
                                       @Valid @RequestBody SolicitudAjusteNomina solicitud) {
        return servicio.crear(periodoId, solicitud);
    }

    @Operation(summary = "Elimina un concepto de un periodo en borrador")
    @DeleteMapping("/ajustes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable UUID id) {
        servicio.eliminar(id);
    }
}
