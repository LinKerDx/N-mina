package mx.nomina360.commons.security;

/**
 * Roles del sistema. Se usan como autoridades ROLE_&lt;ROL&gt;.
 */
public final class Roles {

    public static final String ADMIN = "ADMIN";
    public static final String RH = "RH";
    public static final String PRODUCCION = "PRODUCCION";
    public static final String ADMINISTRACION = "ADMINISTRACION";

    public static String autoridad(String rol) {
        return "ROLE_" + rol;
    }

    private Roles() {
    }
}
