package mx.nomina360.produccion.dto;

import mx.nomina360.produccion.dominio.MarcacionAsistencia;
import mx.nomina360.produccion.dominio.OrigenMarcacion;
import mx.nomina360.produccion.dominio.TipoMarcacion;

import java.time.Instant;
import java.util.UUID;

public record RespuestaMarcacion(
        UUID id,
        UUID empleadoId,
        String empleadoNombre,
        TipoMarcacion tipo,
        Instant ocurridoEn,
        OrigenMarcacion origen,
        String dispositivoId,
        String eventoDispositivoId) {

    public static RespuestaMarcacion desde(MarcacionAsistencia marcacion) {
        return new RespuestaMarcacion(
                marcacion.getId(),
                marcacion.getEmpleadoId(),
                marcacion.getEmpleadoNombre(),
                marcacion.getTipo(),
                marcacion.getOcurridoEn(),
                marcacion.getOrigen(),
                marcacion.getDispositivoId(),
                marcacion.getEventoDispositivoId());
    }
}
