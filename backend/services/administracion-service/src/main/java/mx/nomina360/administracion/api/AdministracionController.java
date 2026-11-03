package mx.nomina360.administracion.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.administracion.dto.RespuestaCentroCosto;
import mx.nomina360.administracion.dto.RespuestaPago;
import mx.nomina360.administracion.dto.RespuestaPresupuesto;
import mx.nomina360.administracion.dto.RespuestaProveedor;
import mx.nomina360.administracion.dto.RespuestaResumenAdmin;
import mx.nomina360.administracion.dto.SolicitudPago;
import mx.nomina360.administracion.dto.SolicitudPresupuesto;
import mx.nomina360.administracion.servicio.AdministracionService;
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

@RestController
@RequestMapping("/api/administracion")
@PreAuthorize("hasAnyRole('ADMIN','ADMINISTRACION')")
@Tag(name = "Administracion", description = "Presupuestos, centros de costo y pagos")
public class AdministracionController {

    private final AdministracionService servicio;

    public AdministracionController(AdministracionService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Centros de costo")
    @GetMapping("/centros-costo")
    public List<RespuestaCentroCosto> centros() {
        return servicio.centros();
    }

    @Operation(summary = "Proveedores")
    @GetMapping("/proveedores")
    public List<RespuestaProveedor> proveedores() {
        return servicio.proveedores();
    }

    @Operation(summary = "Presupuestos del ejercicio")
    @GetMapping("/presupuestos")
    public List<RespuestaPresupuesto> presupuestos(@RequestParam(defaultValue = "0") int ejercicio) {
        return servicio.listarPresupuestos(ejercicio == 0 ? LocalDate.now().getYear() : ejercicio);
    }

    @Operation(summary = "Define o actualiza el presupuesto mensual de un centro de costo")
    @PostMapping("/presupuestos")
    public RespuestaPresupuesto definirPresupuesto(@Valid @RequestBody SolicitudPresupuesto solicitud) {
        return servicio.definirPresupuesto(solicitud);
    }

    @Operation(summary = "Pagos registrados en un rango de fechas")
    @GetMapping("/pagos")
    public List<RespuestaPago> pagos(@RequestParam(required = false) LocalDate desde,
                                     @RequestParam(required = false) LocalDate hasta) {
        return servicio.listarPagos(desde, hasta);
    }

    @Operation(summary = "Registra un pago afectando el presupuesto del centro de costo")
    @PostMapping("/pagos")
    @ResponseStatus(HttpStatus.CREATED)
    public RespuestaPago registrarPago(@Valid @RequestBody SolicitudPago solicitud) {
        return servicio.registrarPago(solicitud);
    }

    @Operation(summary = "Resumen presupuestal del ejercicio")
    @GetMapping("/resumen")
    public RespuestaResumenAdmin resumen(@RequestParam(defaultValue = "0") int ejercicio) {
        return servicio.resumen(ejercicio == 0 ? LocalDate.now().getYear() : ejercicio);
    }
}
