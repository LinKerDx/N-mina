package mx.nomina360.commons.web.web;

/**
 * Encabezados propios del sistema (el gateway propaga la identidad ya validada).
 */
public final class Encabezados {

    public static final String CORRELACION = "X-Correlation-Id";
    public static final String USUARIO_ID = "X-User-Id";
    public static final String USUARIO_EMAIL = "X-User-Email";
    public static final String USUARIO_ROL = "X-User-Rol";
    public static final String USUARIO_AREA = "X-User-Area";

    private Encabezados() {
    }
}
