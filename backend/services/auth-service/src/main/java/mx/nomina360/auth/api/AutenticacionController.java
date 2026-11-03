package mx.nomina360.auth.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mx.nomina360.auth.dto.RespuestaTokens;
import mx.nomina360.auth.dto.RespuestaUsuario;
import mx.nomina360.auth.dto.SolicitudLogin;
import mx.nomina360.auth.dto.SolicitudRefresh;
import mx.nomina360.auth.servicio.AutenticacionService;
import mx.nomina360.commons.security.UsuarioActual;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticacion", description = "Login, refresh y perfil del usuario")
public class AutenticacionController {

    private final AutenticacionService servicio;

    public AutenticacionController(AutenticacionService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Inicia sesion y devuelve access + refresh token")
    @PostMapping("/login")
    public RespuestaTokens login(@Valid @RequestBody SolicitudLogin solicitud) {
        return servicio.iniciarSesion(solicitud.email(), solicitud.password());
    }

    @Operation(summary = "Rota el refresh token y emite un nuevo access token")
    @PostMapping("/refresh")
    public RespuestaTokens refresh(@Valid @RequestBody SolicitudRefresh solicitud) {
        return servicio.refrescar(solicitud.refreshToken());
    }

    @Operation(summary = "Revoca el refresh token indicado")
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody SolicitudRefresh solicitud) {
        servicio.cerrarSesion(solicitud.refreshToken());
    }

    @Operation(summary = "Perfil del usuario autenticado")
    @GetMapping("/me")
    public RespuestaUsuario me() {
        return servicio.perfil(UsuarioActual.requerido().id());
    }
}
