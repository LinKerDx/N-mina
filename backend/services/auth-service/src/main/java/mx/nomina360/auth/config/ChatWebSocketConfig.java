package mx.nomina360.auth.config;

import mx.nomina360.auth.servicio.ChatWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

@Configuration
@EnableWebSocket
public class ChatWebSocketConfig implements WebSocketConfigurer {
    private final ChatWebSocketHandler handler;
    private final ChatHandshakeInterceptor interceptor;
    public ChatWebSocketConfig(ChatWebSocketHandler handler, ChatHandshakeInterceptor interceptor) {
        this.handler = handler;
        this.interceptor = interceptor;
    }
    @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        DefaultHandshakeHandler handshake = new DefaultHandshakeHandler();
        handshake.setSupportedProtocols("nomina360-chat");
        registry.addHandler(handler, "/api/auth/chat/ws").addInterceptors(interceptor)
                .setAllowedOriginPatterns("*").setHandshakeHandler(handshake);
    }
}
