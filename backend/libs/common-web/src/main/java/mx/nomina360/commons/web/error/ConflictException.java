package mx.nomina360.commons.web.error;

import org.springframework.http.HttpStatus;

public class ConflictException extends BusinessException {

    public ConflictException(String mensaje) {
        super("CONFLICTO_ESTADO", mensaje, HttpStatus.CONFLICT);
    }
}
