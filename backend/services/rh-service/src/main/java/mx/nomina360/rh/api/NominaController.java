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
import mx.nomina360.rh.servicio.ReciboPdfService;
import org.springframework.data.domain.Page;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rh")
@Tag(name = "Nomina", description = "Periodos, calculo y recibos de nomina")
public class NominaController {

    private final NominaService servicio;
    private final ReciboPdfService servicioPdf;

    public NominaController(NominaService servicio, ReciboPdfService servicioPdf) {
        this.servicio = servicio;
        this.servicioPdf = servicioPdf;
    }

    @Operation(summary = "Lista los periodos de nomina")
    @GetMapping("/periodos")
    @PreAuthorize("hasAnyRole('ADMIN','RH','ADMINISTRACION')")
    public PageResponse<RespuestaPeriodo> listar(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "12") int size) {
        Page<RespuestaPeriodo> resultado = servicio.listarPeriodos(page, size);
        return PageResponse.de(resultado.getContent(), resultado.getNumber(), resultado.getSize(),
                resultado.getTotalElements());
    }

    @Operation(summary = "Crea un periodo de nomina")
    @PostMapping("/periodos")
    @PreAuthorize("hasAnyRole('ADMIN','RH')")
    @ResponseStatus(HttpStatus.CREATED)
    public RespuestaPeriodo crear(@Valid @RequestBody SolicitudPeriodo solicitud) {
        return servicio.crearPeriodo(solicitud);
    }

    @Operation(summary = "Calcula los recibos del periodo")
    @PostMapping("/periodos/{id}/calcular")
    @PreAuthorize("hasAnyRole('ADMIN','RH')")
    public RespuestaCalculo calcular(@PathVariable UUID id) {
        return servicio.calcular(id);
    }

    @Operation(summary = "Cierra el periodo calculado")
    @PostMapping("/periodos/{id}/cerrar")
    @PreAuthorize("hasAnyRole('ADMIN','RH')")
    public RespuestaPeriodo cerrar(@PathVariable UUID id) {
        return servicio.cerrarPeriodo(id);
    }

    @Operation(summary = "Recibos del periodo con sus conceptos")
    @GetMapping("/periodos/{id}/recibos")
    @PreAuthorize("hasAnyRole('ADMIN','RH')")
    public List<RespuestaRecibo> recibos(@PathVariable UUID id) {
        return servicio.recibosDePeriodo(id);
    }

    @Operation(summary = "Descarga el recibo en PDF con el desglose y los datos del trabajador")
    @GetMapping("/recibos/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','RH')")
    public ResponseEntity<byte[]> reciboPdf(@PathVariable UUID id) {
        ReciboPdfService.DocumentoPdf documento = servicioPdf.generar(id);

        ContentDisposition disposicion = ContentDisposition.attachment()
                .filename(documento.nombreArchivo(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposicion.toString())
                .contentLength(documento.contenido().length)
                .body(documento.contenido());
    }
}
