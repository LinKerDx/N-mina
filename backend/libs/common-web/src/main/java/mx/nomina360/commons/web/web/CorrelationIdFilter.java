package mx.nomina360.commons.web.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Garantiza un identificador de correlacion por peticion (logs y soporte).
 */
public class CorrelationIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String correlacion = request.getHeader(Encabezados.CORRELACION);
        if (correlacion == null || correlacion.isBlank()) {
            correlacion = UUID.randomUUID().toString();
        }
        MDC.put("correlationId", correlacion);
        response.setHeader(Encabezados.CORRELACION, correlacion);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }
}
