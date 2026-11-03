package mx.nomina360.administracion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableMethodSecurity
public class AdministracionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdministracionServiceApplication.class, args);
    }
}
