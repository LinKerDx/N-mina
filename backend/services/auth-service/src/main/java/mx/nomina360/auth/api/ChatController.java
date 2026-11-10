package mx.nomina360.auth.api;

import jakarta.validation.Valid;
import mx.nomina360.auth.dto.ContactoChat;
import mx.nomina360.auth.dto.RespuestaChat;
import mx.nomina360.auth.dto.SolicitudChat;
import mx.nomina360.auth.servicio.ChatService;
import mx.nomina360.commons.security.UsuarioActual;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/auth/chat") @PreAuthorize("isAuthenticated()")
public class ChatController {
    private final ChatService chat;
    public ChatController(ChatService chat) { this.chat=chat; }
    @GetMapping("/contactos") public List<ContactoChat> contactos() { return chat.contactos(UsuarioActual.requerido()); }
    @GetMapping("/{usuarioId}") public List<RespuestaChat> conversar(@PathVariable UUID usuarioId) { return chat.conversar(UsuarioActual.requerido(),usuarioId); }
    @PostMapping("/{usuarioId}") @ResponseStatus(HttpStatus.CREATED)
    public RespuestaChat enviar(@PathVariable UUID usuarioId,@Valid @RequestBody SolicitudChat solicitud) { return chat.enviar(UsuarioActual.requerido(),usuarioId,solicitud); }
}
