package mx.nomina360.auth.dto;
import mx.nomina360.auth.dominio.Usuario;
import java.util.UUID;
public record ContactoChat(UUID id, String nombre, String rol, String area) {
    public static ContactoChat desde(Usuario u) { return new ContactoChat(u.getId(),u.getNombreCompleto(),u.getRol(),u.getArea()); }
}
