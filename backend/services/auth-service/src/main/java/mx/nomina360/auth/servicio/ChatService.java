package mx.nomina360.auth.servicio;

import mx.nomina360.auth.dominio.MensajeChat;
import mx.nomina360.auth.dominio.Usuario;
import mx.nomina360.auth.dto.ContactoChat;
import mx.nomina360.auth.dto.RespuestaChat;
import mx.nomina360.auth.dto.SolicitudChat;
import mx.nomina360.auth.repositorio.MensajeChatRepository;
import mx.nomina360.auth.repositorio.UsuarioRepository;
import mx.nomina360.commons.jwt.UsuarioJwt;
import mx.nomina360.commons.web.error.NotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
public class ChatService {
    private final UsuarioRepository usuarios;
    private final MensajeChatRepository mensajes;
    public ChatService(UsuarioRepository usuarios, MensajeChatRepository mensajes) { this.usuarios=usuarios; this.mensajes=mensajes; }

    @Transactional(readOnly=true)
    public List<ContactoChat> contactos(UsuarioJwt actual) {
        Usuario yo = usuario(actual.id());
        return usuarios.findAllByActivoTrueOrderByNombreCompletoAsc().stream()
                .filter(u -> !u.getId().equals(yo.getId()) && permitido(yo,u))
                .map(ContactoChat::desde).toList();
    }

    @Transactional(readOnly=true)
    public List<RespuestaChat> conversar(UsuarioJwt actual, UUID destino) {
        Usuario yo=usuario(actual.id()), otro=usuario(destino);
        verificar(yo,otro);
        return mensajes.conversacion(yo.getId(),otro.getId()).stream().map(RespuestaChat::desde).toList();
    }

    @Transactional
    public RespuestaChat enviar(UsuarioJwt actual, UUID destino, SolicitudChat solicitud) {
        Usuario yo=usuario(actual.id()), otro=usuario(destino);
        verificar(yo,otro);
        MensajeChat m=new MensajeChat(); m.setRemitenteId(yo.getId()); m.setDestinatarioId(otro.getId()); m.setContenido(solicitud.contenido().trim());
        return RespuestaChat.desde(mensajes.save(m));
    }

    private void verificar(Usuario yo, Usuario otro) { if (!permitido(yo,otro)) throw new AccessDeniedException("No tienes acceso a esta conversación"); }
    private boolean permitido(Usuario yo, Usuario otro) {
        if (yo.getRol().equals("EMPLEADO")) {
            if (otro.getRol().equals("RH") || otro.getRol().equals("ADMINISTRACION")) return true;
            // La jefatura se resuelve por el responsable funcional de cada área.
            String rolJefatura = switch (yo.getArea().toLowerCase()) {
                case "produccion" -> "PRODUCCION";
                case "administracion" -> "ADMIN";
                case "recursos humanos" -> "RH";
                default -> "";
            };
            return otro.getRol().equals(rolJefatura) && yo.getArea().equalsIgnoreCase(otro.getArea());
        }
        return true;
    }
    private Usuario usuario(UUID id) { return usuarios.findById(id).filter(u -> Boolean.TRUE.equals(u.getActivo())).orElseThrow(() -> new NotFoundException("Usuario no encontrado")); }
}
