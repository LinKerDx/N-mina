package mx.nomina360.commons.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

/**
 * Servicio compartido de emision y validacion de access tokens.
 */
public class JwtService {

    private static final int TAMANO_MINIMO_SECRETO = 32;

    private final JwtProperties propiedades;
    private final SecretKey llave;

    public JwtService(JwtProperties propiedades) {
        this.propiedades = propiedades;
        byte[] bytes = propiedades.secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < TAMANO_MINIMO_SECRETO) {
            throw new IllegalStateException(
                    "security.jwt.secret debe tener al menos " + TAMANO_MINIMO_SECRETO + " bytes (HS256)");
        }
        this.llave = Keys.hmacShaKeyFor(bytes);
    }

    public String crearAccessToken(UsuarioJwt usuario) {
        Instant ahora = Instant.now();
        Instant expiracion = ahora.plus(propiedades.accessTokenMinutes(), ChronoUnit.MINUTES);
        return Jwts.builder()
                .issuer(propiedades.issuer())
                .subject(usuario.id().toString())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(expiracion))
                .claim("email", usuario.email())
                .claim("rol", usuario.rol())
                .claim("area", usuario.area())
                .signWith(llave, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Valida firma, emisor y expiracion.
     *
     * @throws JwtException si el token no es valido o expiro
     */
    public UsuarioJwt validar(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(llave)
                .requireIssuer(propiedades.issuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return new UsuarioJwt(
                UUID.fromString(claims.getSubject()),
                claims.get("email", String.class),
                claims.get("rol", String.class),
                claims.get("area", String.class));
    }

    public long minutosVigenciaAccessToken() {
        return propiedades.accessTokenMinutes();
    }

    public long diasVigenciaRefreshToken() {
        return propiedades.refreshTokenDays();
    }
}
