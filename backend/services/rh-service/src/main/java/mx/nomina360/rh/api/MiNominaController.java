package mx.nomina360.rh.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import mx.nomina360.commons.security.UsuarioActual;
import mx.nomina360.rh.dto.MiPerfilRespuesta;
import mx.nomina360.rh.dto.MiReciboDetalle;
import mx.nomina360.rh.dto.MiReciboResumen;
import mx.nomina360.rh.dto.MiResumenNomina;
import mx.nomina360.rh.servicio.MiNominaService;
import mx.nomina360.rh.servicio.ReciboPdfService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

/**
 * Portal de autoservicio: cada empleado consulta únicamente su propia nómina.
 */
@RestController
@RequestMapping("/api/rh/mi-nomina")
@PreAuthorize("hasRole('EMPLEADO')")
@Tag(name = "Mi nomina", description = "Autoservicio del empleado: perfil, recibos y PDF")
public class MiNominaController {

    private final MiNominaService servicio;

    public MiNominaController(MiNominaService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Datos del trabajador autenticado")
    @GetMapping("/perfil")
    public MiPerfilRespuesta perfil() {
        return servicio.perfil(UsuarioActual.requerido().email());
    }

    @Operation(summary = "Historial de recibos del trabajador")
    @GetMapping("/recibos")
    public List<MiReciboResumen> recibos() {
        return servicio.recibos(UsuarioActual.requerido().email());
    }

    @Operation(summary = "Desglose de un recibo propio")
    @GetMapping("/recibos/{id}")
    public MiReciboDetalle detalle(@PathVariable UUID id) {
        return servicio.detalle(UsuarioActual.requerido().email(), id);
    }

    @Operation(summary = "Acumulados para la cabecera del portal")
    @GetMapping("/resumen")
    public MiResumenNomina resumen() {
        return servicio.resumen(UsuarioActual.requerido().email());
    }

    @Operation(summary = "Recibo propio en PDF")
    @GetMapping("/recibos/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
        ReciboPdfService.DocumentoPdf documento = servicio.pdf(UsuarioActual.requerido().email(), id);

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
