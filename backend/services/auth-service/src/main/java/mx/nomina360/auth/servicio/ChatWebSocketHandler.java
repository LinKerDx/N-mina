package mx.nomina360.auth.servicio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import mx.nomina360.auth.dto.RespuestaChat;
import mx.nomina360.auth.dto.SolicitudChat;
import mx.nomina360.commons.jwt.UsuarioJwt;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {
    private final ChatService chat;
    private final ObjectMapper mapper;
    private final Map<String, WebSocketSession> sesiones = new ConcurrentHashMap<>();
    public ChatWebSocketHandler(ChatService chat, ObjectMapper mapper) { this.chat=chat; this.mapper=mapper; }

    @Override public void afterConnectionEstablished(WebSocketSession session) {
        if (session.getAttributes().get("usuarioJwt") instanceof UsuarioJwt) sesiones.put(session.getId(), session);
        else try { session.close(CloseStatus.NOT_ACCEPTABLE); } catch (Exception ignored) { }
    }

    @Override protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            UsuarioJwt usuario = (UsuarioJwt) session.getAttributes().get("usuarioJwt");
            JsonNode json = mapper.readTree(message.getPayload());
            UUID contacto = UUID.fromString(json.path("contactoId").asText());
            String tipo = json.path("tipo").asText();
            if ("suscribir".equals(tipo)) {
                session.getAttributes().put("contactoId", contacto);
                enviar(session, Map.of("tipo", "historial", "mensajes", chat.conversar(usuario, contacto)));
            } else if ("enviar".equals(tipo)) {
                if (!contacto.equals(session.getAttributes().get("contactoId"))) throw new IllegalArgumentException("Conversación no seleccionada");
                String contenido = json.path("contenido").asText("").trim();
                if (contenido.isBlank() || contenido.length() > 2000) throw new IllegalArgumentException("Mensaje vacío o demasiado largo");
                RespuestaChat guardado = chat.enviar(usuario, contacto, new SolicitudChat(contenido));
                difundir(usuario.id(), contacto, guardado);
            }
        } catch (Exception ex) {
            enviar(session, Map.of("tipo", "error", "mensaje", "No se pudo procesar el mensaje."));
        }
    }

    private void difundir(UUID remitente, UUID contacto, RespuestaChat mensaje) {
        sesiones.values().forEach(sesion -> {
            Object principal = sesion.getAttributes().get("usuarioJwt");
            Object conversacion = sesion.getAttributes().get("contactoId");
            if (principal instanceof UsuarioJwt u && conversacion instanceof UUID c
                    && ((u.id().equals(remitente) && c.equals(contacto)) || (u.id().equals(contacto) && c.equals(remitente)))) {
                enviar(sesion, Map.of("tipo", "mensaje", "mensaje", mensaje));
            }
        });
    }

    private void enviar(WebSocketSession session, Object payload) {
        try {
            if (session.isOpen()) synchronized (session) { session.sendMessage(new TextMessage(mapper.writeValueAsString(payload))); }
        } catch (Exception ignored) { }
    }

    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { sesiones.remove(session.getId()); }
}
