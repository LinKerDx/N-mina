package mx.nomina360.rh.nomina;

import java.util.Set;

/**
 * Tipos de incidencia que alimentan el calculo de nomina.
 */
public final class TiposIncidencia {

    public static final String FALTA = "FALTA";
    public static final String RETARDO = "RETARDO";
    public static final String HORAS_EXTRA = "HORAS_EXTRA";
    public static final String VACACIONES = "VACACIONES";
    public static final String INCAPACIDAD = "INCAPACIDAD";
    public static final String PERMISO = "PERMISO";
    public static final String BONO_PRODUCTIVIDAD = "BONO_PRODUCTIVIDAD";

    public static final Set<String> VALIDOS = Set.of(
            FALTA, RETARDO, HORAS_EXTRA, VACACIONES, INCAPACIDAD, PERMISO, BONO_PRODUCTIVIDAD);

    private TiposIncidencia() {
    }
}
