package mx.nomina360.commons.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import mx.nomina360.commons.web.api.ApiError;
import org.slf4j.MDC;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

/**
 * Respuestas JSON para los filtros de seguridad (antes de llegar a MVC).
 */
public final class SeguridadRespuestas {

    public static void escribir(HttpServletResponse response, ObjectMapper mapper, int status,
                                String codigo, String mensaje, String ruta) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        ApiError error = new ApiError(Instant.now(), status, codigo, mensaje, ruta,
                MDC.get("correlationId"), List.of());
        mapper.writeValue(response.getOutputStream(), error);
    }

    private SeguridadRespuestas() {
    }
}
