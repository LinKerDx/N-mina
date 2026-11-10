package mx.nomina360.auth.config;

import mx.nomina360.commons.jwt.JwtService;
import mx.nomina360.commons.jwt.UsuarioJwt;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import java.util.Map;

@Component
public class ChatHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtService jwtService;
    public ChatHandshakeInterceptor(JwtService jwtService) { this.jwtService = jwtService; }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler handler, Map<String, Object> attributes) {
        String protocolos = request.getHeaders().getFirst("Sec-WebSocket-Protocol");
        if (protocolos == null) return false;
        for (String protocolo : protocolos.split(",")) {
            String valor = protocolo.trim();
            if (valor.startsWith("bearer.")) {
                try {
                    UsuarioJwt usuario = jwtService.validar(valor.substring("bearer.".length()));
                    attributes.put("usuarioJwt", usuario);
                    return true;
                } catch (RuntimeException ignored) {
                    return false;
                }
            }
        }
        return false;
    }

    @Override public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                          WebSocketHandler handler, Exception exception) { }
}
