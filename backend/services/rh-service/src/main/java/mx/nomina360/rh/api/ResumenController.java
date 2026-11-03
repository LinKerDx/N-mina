package mx.nomina360.rh.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import mx.nomina360.rh.dto.RespuestaResumenGeneral;
import mx.nomina360.rh.servicio.NominaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * KPIs de RH disponibles para el personal (no para el portal del empleado).
 */
@RestController
@RequestMapping("/api/rh")
@PreAuthorize("hasAnyRole('ADMIN','RH','PRODUCCION','ADMINISTRACION')")
@Tag(name = "Resumen", description = "Indicadores para el tablero")
public class ResumenController {

    private final NominaService servicio;

    public ResumenController(NominaService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Empleados activos, periodos abiertos y neto del periodo reciente")
    @GetMapping("/resumen")
    public RespuestaResumenGeneral resumen() {
        return servicio.resumen();
    }
}
