package mx.nomina360.commons.web.error;

import org.springframework.http.HttpStatus;

/**
 * Error de negocio controlado: se traduce a un ApiError con el status indicado.
 */
public class BusinessException extends RuntimeException {

    private final String codigo;
    private final HttpStatus estado;

    public BusinessException(String codigo, String mensaje, HttpStatus estado) {
        super(mensaje);
        this.codigo = codigo;
        this.estado = estado;
    }

    public BusinessException(String codigo, String mensaje) {
        this(codigo, mensaje, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public String getCodigo() {
        return codigo;
    }

    public HttpStatus getEstado() {
        return estado;
    }
}
