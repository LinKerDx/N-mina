package mx.nomina360.administracion.dto;

import mx.nomina360.administracion.dominio.CentroCosto;

import java.util.UUID;

public record RespuestaCentroCosto(UUID id, String codigo, String nombre, String area, boolean activo) {

    public static RespuestaCentroCosto desde(CentroCosto centro) {
        return new RespuestaCentroCosto(centro.getId(), centro.getCodigo(), centro.getNombre(),
                centro.getArea(), Boolean.TRUE.equals(centro.getActivo()));
    }
}
