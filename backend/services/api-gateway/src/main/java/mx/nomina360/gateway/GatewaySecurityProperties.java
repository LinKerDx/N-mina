package mx.nomina360.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Rutas que no requieren JWT en el gateway.
 */
@ConfigurationProperties(prefix = "security.gateway")
public record GatewaySecurityProperties(List<String> publicPaths) {

    public GatewaySecurityProperties {
        if (publicPaths == null || publicPaths.isEmpty()) {
            publicPaths = List.of(
                    "/api/auth/login",
                    "/api/auth/refresh",
                    "/actuator/health",
                    "/actuator/health/**",
                    "/actuator/info");
        }
    }
}
