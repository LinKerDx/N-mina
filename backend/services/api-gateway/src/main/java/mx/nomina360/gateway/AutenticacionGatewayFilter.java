package mx.nomina360.gateway;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import mx.nomina360.commons.jwt.JwtService;
import mx.nomina360.commons.jwt.UsuarioJwt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Valida el JWT en el borde y propaga la identidad a los microservicios mediante
 * encabezados. Tambien garantiza el X-Correlation-Id de toda la traza.
 */
@Component
@EnableConfigurationProperties(GatewaySecurityProperties.class)
public class AutenticacionGatewayFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AutenticacionGatewayFilter.class);

    private static final String CORRELACION = "X-Correlation-Id";
    private static final String USUARIO_ID = "X-User-Id";
    private static final String USUARIO_EMAIL = "X-User-Email";
    private static final String USUARIO_ROL = "X-User-Rol";
    private static final String USUARIO_AREA = "X-User-Area";

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final GatewaySecurityProperties propiedades;

    public AutenticacionGatewayFilter(JwtService jwtService,
                                      ObjectMapper objectMapper,
                                      GatewaySecurityProperties propiedades) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.propiedades = propiedades;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest peticion = exchange.getRequest();
        String ruta = peticion.getPath().value();
        String correlacion = peticion.getHeaders().getFirst(CORRELACION);
        String correlacionFinal = (correlacion == null || correlacion.isBlank())
                ? UUID.randomUUID().toString()
                : correlacion;

        exchange.getResponse().getHeaders().set(CORRELACION, correlacionFinal);
        ServerHttpRequest.Builder constructor = peticion.mutate().header(CORRELACION, correlacionFinal);

        if ("OPTIONS".equalsIgnoreCase(peticion.getMethod().name()) || esPublica(ruta)) {
            return chain.filter(exchange.mutate().request(constructor.build()).build());
        }

        String cabecera = peticion.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (cabecera == null || !cabecera.startsWith("Bearer ")) {
            return responderError(exchange, correlacionFinal, HttpStatus.UNAUTHORIZED,
                    "NO_AUTENTICADO", "Se requiere un token valido");
        }

        try {
            UsuarioJwt usuario = jwtService.validar(cabecera.substring(7).trim());
            constructor
                    .header(USUARIO_ID, usuario.id().toString())
                    .header(USUARIO_EMAIL, valorSeguro(usuario.email()))
                    .header(USUARIO_ROL, valorSeguro(usuario.rol()))
                    .header(USUARIO_AREA, valorSeguro(usuario.area()));
            return chain.filter(exchange.mutate().request(constructor.build()).build());
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Token rechazado en {}: {}", ruta, ex.getMessage());
            return responderError(exchange, correlacionFinal, HttpStatus.UNAUTHORIZED,
                    "TOKEN_INVALIDO", "El token es invalido o expiro");
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private boolean esPublica(String ruta) {
        return propiedades.publicPaths().stream()
                .anyMatch(patron -> patron.endsWith("/**")
                        ? ruta.startsWith(patron.substring(0, patron.length() - 3))
                        : ruta.equals(patron));
    }

    private Mono<Void> responderError(ServerWebExchange exchange, String correlacion, HttpStatus estado,
                                      String codigo, String mensaje) {
        ServerHttpResponse respuesta = exchange.getResponse();
        respuesta.setStatusCode(estado);
        respuesta.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("timestamp", Instant.now().toString());
        cuerpo.put("status", estado.value());
        cuerpo.put("codigo", codigo);
        cuerpo.put("mensaje", mensaje);
        cuerpo.put("ruta", exchange.getRequest().getPath().value());
        cuerpo.put("correlationId", correlacion);
        cuerpo.put("detalles", java.util.List.of());

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(cuerpo);
        } catch (JsonProcessingException ex) {
            bytes = ("{\"mensaje\":\"" + mensaje + "\"}").getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
        return respuesta.writeWith(Mono.just(respuesta.bufferFactory().wrap(bytes)));
    }

    private static String valorSeguro(String valor) {
        return valor == null ? "" : valor;
    }
}
