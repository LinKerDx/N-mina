package mx.nomina360.produccion.dto;

import mx.nomina360.produccion.dominio.CentroTrabajo;

import java.util.UUID;

public record RespuestaCentroTrabajo(UUID id, String codigo, String nombre, Integer capacidadDiaria, boolean activo) {

    public static RespuestaCentroTrabajo desde(CentroTrabajo centro) {
        return new RespuestaCentroTrabajo(centro.getId(), centro.getCodigo(), centro.getNombre(),
                centro.getCapacidadDiaria(), Boolean.TRUE.equals(centro.getActivo()));
    }
}
