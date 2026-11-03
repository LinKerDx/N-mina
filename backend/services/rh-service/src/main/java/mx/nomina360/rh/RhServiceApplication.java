package mx.nomina360.rh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableMethodSecurity
public class RhServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RhServiceApplication.class, args);
    }
}
