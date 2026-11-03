package mx.nomina360.commons.web.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import mx.nomina360.commons.web.api.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

/**
 * Traduce excepciones a un contrato de error unico (RFC-7807 simplificado).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> manejarNegocio(BusinessException ex, HttpServletRequest request) {
        return ResponseEntity.status(ex.getEstado())
                .body(ApiError.de(ex.getEstado(), ex.getCodigo(), ex.getMessage(), request.getRequestURI(), List.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> manejarValidacion(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> detalles = ex.getBindingResult().getFieldErrors().stream()
                .map(this::describirCampo)
                .toList();
        return ResponseEntity.badRequest()
                .body(ApiError.de(HttpStatus.BAD_REQUEST, "DATOS_INVALIDOS",
                        "La peticion contiene datos invalidos", request.getRequestURI(), detalles));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> manejarRestricciones(ConstraintViolationException ex, HttpServletRequest request) {
        List<String> detalles = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .toList();
        return ResponseEntity.badRequest()
                .body(ApiError.de(HttpStatus.BAD_REQUEST, "DATOS_INVALIDOS",
                        "La peticion contiene datos invalidos", request.getRequestURI(), detalles));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class})
    public ResponseEntity<ApiError> manejarPeticionInvalida(Exception ex, HttpServletRequest request) {
        return ResponseEntity.badRequest()
                .body(ApiError.de(HttpStatus.BAD_REQUEST, "PETICION_INVALIDA",
                        "El cuerpo o los parametros de la peticion no son validos",
                        request.getRequestURI(), List.of(ex.getMessage() == null ? "" : ex.getMessage())));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> manejarMetodo(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiError.de(HttpStatus.METHOD_NOT_ALLOWED, "METODO_NO_PERMITIDO",
                        ex.getMessage(), request.getRequestURI(), List.of()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> manejarRutaInexistente(NoResourceFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.de(HttpStatus.NOT_FOUND, "RUTA_NO_ENCONTRADA",
                        "La ruta solicitada no existe", request.getRequestURI(), List.of()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> manejarInesperado(Exception ex, HttpServletRequest request) {
        log.error("Error no controlado en {} {}", request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.de(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO",
                        "Ocurrio un error inesperado. Reporta el correlationId a soporte.",
                        request.getRequestURI(), List.of()));
    }

    private String describirCampo(FieldError error) {
        return error.getField() + ": " + (error.getDefaultMessage() == null ? "valor invalido" : error.getDefaultMessage());
    }
}
