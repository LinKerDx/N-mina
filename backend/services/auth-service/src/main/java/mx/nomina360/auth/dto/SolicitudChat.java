package mx.nomina360.auth.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record SolicitudChat(@NotBlank @Size(max=2000) String contenido) {}
