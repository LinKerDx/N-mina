package mx.nomina360.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitudLogin(

        @NotBlank(message = "el correo es obligatorio")
        @Email(message = "el correo no tiene un formato valido")
        String email,

        @NotBlank(message = "la contrasena es obligatoria")
        @Size(min = 8, max = 72, message = "la contrasena debe tener entre 8 y 72 caracteres")
        String password) {
}
