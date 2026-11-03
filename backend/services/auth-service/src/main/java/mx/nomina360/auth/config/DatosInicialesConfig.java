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
 * Crea las cuentas de demostracion que falten (idempotente por correo).
 *
 * <p>Incluye cuentas de empleado cuyo correo coincide con el del empleado en
 * {@code rh_db}; asi el portal de autoservicio puede resolver "mi nomina"
 * sin duplicar identidades entre microservicios.
 *
 * <p>Desactivalo con {@code NOMINA_DATOS_INICIALES_ENABLED=false}.
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
            if (!habilitado) {
                return;
            }

            List<Usuario> demo = List.of(
                    usuario("admin@nomina360.mx", "Ana Admin", Roles.ADMIN, "Administracion", passwordEncoder),
                    usuario("rh@nomina360.mx", "Rosa Hernandez", Roles.RH, "Recursos Humanos", passwordEncoder),
                    usuario("produccion@nomina360.mx", "Pedro Produccion", Roles.PRODUCCION, "Produccion", passwordEncoder),
                    usuario("admin.finanzas@nomina360.mx", "Frida Finanzas", Roles.ADMINISTRACION, "Administracion", passwordEncoder),
                    usuario("ana.lopez@nomina360.mx", "Ana Lopez Garcia", Roles.EMPLEADO, "Produccion", passwordEncoder),
                    usuario("luis.ramirez@nomina360.mx", "Luis Ramirez Soto", Roles.EMPLEADO, "Produccion", passwordEncoder),
                    usuario("marta.sanchez@nomina360.mx", "Marta Sanchez Ruiz", Roles.EMPLEADO, "Administracion", passwordEncoder));

            int creados = 0;
            for (Usuario candidato : demo) {
                if (usuarios.existsByEmailIgnoreCase(candidato.getEmail())) {
                    continue;
                }
                usuarios.save(candidato);
                creados++;
            }

            if (creados > 0) {
                log.info("Usuarios demo creados: {}. Contrasena inicial: {} (cambiala en produccion)",
                        creados, PASSWORD_DEMO);
            }
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
