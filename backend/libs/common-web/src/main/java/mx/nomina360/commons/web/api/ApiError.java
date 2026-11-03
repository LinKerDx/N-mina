package mx.nomina360.commons.web.api;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

/**
 * Contrato uniforme de error para todos los microservicios.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String codigo,
        String mensaje,
        String ruta,
        String correlationId,
        List<String> detalles) {

    public static ApiError de(HttpStatus estado, String codigo, String mensaje, String ruta, List<String> detalles) {
        return new ApiError(
                Instant.now(),
                estado.value(),
                codigo,
                mensaje,
                ruta,
                MDC.get("correlationId"),
                detalles == null ? List.of() : List.copyOf(detalles));
    }
}
