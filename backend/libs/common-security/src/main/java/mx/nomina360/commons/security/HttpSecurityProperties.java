package mx.nomina360.commons.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Rutas publicas que no requieren JWT (salud, documentacion y login).
 */
@ConfigurationProperties(prefix = "security.http")
public record HttpSecurityProperties(List<String> publicPaths) {

    public HttpSecurityProperties {
        if (publicPaths == null || publicPaths.isEmpty()) {
            publicPaths = List.of(
                    "/actuator/health",
                    "/actuator/health/**",
                    "/actuator/info",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api/auth/login",
                    "/api/auth/refresh");
        }
    }
}
