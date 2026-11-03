package mx.nomina360.commons.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuracion del token JWT. El secreto debe tener al menos 32 bytes (HS256).
 */
@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        String secret,
        String issuer,
        long accessTokenMinutes,
        long refreshTokenDays) {

    public JwtProperties {
        if (issuer == null || issuer.isBlank()) {
            issuer = "nomina360";
        }
        if (accessTokenMinutes <= 0) {
            accessTokenMinutes = 30;
        }
        if (refreshTokenDays <= 0) {
            refreshTokenDays = 7;
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "Falta security.jwt.secret: define la variable de entorno JWT_SECRET");
        }
    }
}
