package mx.nomina360.produccion.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SolicitudRegistros(

        @NotEmpty(message = "debes enviar al menos un registro")
        @Valid
        List<SolicitudRegistro> registros) {
}
