package mx.nomina360.auth.dto;

import mx.nomina360.auth.dominio.Usuario;

import java.util.UUID;

public record RespuestaUsuario(
        UUID id,
        String email,
        String nombreCompleto,
        String rol,
        String area) {

    public static RespuestaUsuario desde(Usuario usuario) {
        return new RespuestaUsuario(usuario.getId(), usuario.getEmail(),
                usuario.getNombreCompleto(), usuario.getRol(), usuario.getArea());
    }
}
