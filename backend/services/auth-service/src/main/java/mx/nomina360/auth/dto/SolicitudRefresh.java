package mx.nomina360.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SolicitudRefresh(

        @NotBlank(message = "el refresh token es obligatorio")
        String refreshToken) {
}
