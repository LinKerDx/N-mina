package mx.nomina360.commons.web.error;

import org.springframework.http.HttpStatus;

public class NotFoundException extends BusinessException {

    public NotFoundException(String mensaje) {
        super("RECURSO_NO_ENCONTRADO", mensaje, HttpStatus.NOT_FOUND);
    }
}
