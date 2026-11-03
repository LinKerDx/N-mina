package mx.nomina360.commons.jwt;

import java.util.UUID;

/**
 * Identidad minima extraida de un JWT valido.
 *
 * @param id    identificador del usuario (subject)
 * @param email correo del usuario
 * @param rol   rol principal (ADMIN, RH, PRODUCCION, ADMINISTRACION)
 * @param area  area funcional asociada al usuario
 */
public record UsuarioJwt(UUID id, String email, String rol, String area) {

    public boolean tieneRol(String... rolesPermitidos) {
        if (rol == null) {
            return false;
        }
        for (String permitido : rolesPermitidos) {
            if (rol.equalsIgnoreCase(permitido)) {
                return true;
            }
        }
        return false;
    }
}
