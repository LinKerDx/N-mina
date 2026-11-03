package mx.nomina360.commons.security;

import jakarta.servlet.http.HttpServletRequest;
import mx.nomina360.commons.web.api.ApiError;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

/**
 * Traduce los rechazos de {@code @PreAuthorize} a 403 con el contrato ApiError.
 *
 * <p>Sin este manejador, la excepción de autorización cae en el manejador genérico
 * de {@code common-web} y se respondería 500 en lugar de 403. Se ordena antes que
 * el manejador global para que gane la resolución más específica.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ManejadorErroresSeguridad {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> accesoDenegado(AccessDeniedException excepcion, HttpServletRequest peticion) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.de(HttpStatus.FORBIDDEN, "ACCESO_DENEGADO",
                        "No tienes permisos para esta operacion",
                        peticion.getRequestURI(), List.of()));
    }
}
