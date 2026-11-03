package mx.nomina360.auth.config;

import mx.nomina360.auth.dominio.Usuario;
import mx.nomina360.auth.repositorio.UsuarioRepository;
import mx.nomina360.commons.security.Roles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

/**
 * Crea usuarios de demostracion (una cuenta por area) la primera vez que arranca
 * el servicio. Desactivalo con NOMINA_DATOS_INICIALES_ENABLED=false.
 */
@Configuration
public class DatosInicialesConfig {

    private static final Logger log = LoggerFactory.getLogger(DatosInicialesConfig.class);
    private static final String PASSWORD_DEMO = "Nomina360!";

    @Bean
    public ApplicationRunner sembrarUsuariosDemo(UsuarioRepository usuarios,
                                                 PasswordEncoder passwordEncoder,
                                                 @Value("${nomina.datos-iniciales.enabled:true}") boolean habilitado) {
        return args -> {
            if (!habilitado || usuarios.count() > 0) {
                return;
            }

            usuarios.saveAll(List.of(
                    usuario("admin@nomina360.mx", "Ana Admin", Roles.ADMIN, "Administracion", passwordEncoder),
                    usuario("rh@nomina360.mx", "Rosa Hernandez", Roles.RH, "Recursos Humanos", passwordEncoder),
                    usuario("produccion@nomina360.mx", "Pedro Produccion", Roles.PRODUCCION, "Produccion", passwordEncoder),
                    usuario("admin.finanzas@nomina360.mx", "Frida Finanzas", Roles.ADMINISTRACION, "Administracion", passwordEncoder)));

            log.info("Usuarios demo creados. Contrasena inicial: {} (cambiala en produccion)", PASSWORD_DEMO);
        };
    }

    private Usuario usuario(String email, String nombre, String rol, String area, PasswordEncoder encoder) {
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setNombreCompleto(nombre);
        usuario.setRol(rol);
        usuario.setArea(area);
        usuario.setPasswordHash(encoder.encode(PASSWORD_DEMO));
        return usuario;
    }
}
