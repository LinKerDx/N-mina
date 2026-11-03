package mx.nomina360.commons.security;

import mx.nomina360.commons.jwt.UsuarioJwt;
import mx.nomina360.commons.web.error.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Acceso tipado al usuario autenticado de la peticion actual.
 */
public final class UsuarioActual {

    public static Optional<UsuarioJwt> actual() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion != null && autenticacion.getPrincipal() instanceof UsuarioJwt usuario) {
            return Optional.of(usuario);
        }
        return Optional.empty();
    }

    public static UsuarioJwt requerido() {
        return actual().orElseThrow(() -> new BusinessException(
                "NO_AUTENTICADO", "Se requiere un token valido", HttpStatus.UNAUTHORIZED));
    }

    private UsuarioActual() {
    }
}
