package mx.nomina360.rh.dto;

import mx.nomina360.rh.dominio.Departamento;

import java.util.UUID;

public record RespuestaDepartamento(UUID id, String nombre, String area, boolean activo) {

    public static RespuestaDepartamento desde(Departamento departamento) {
        return new RespuestaDepartamento(departamento.getId(), departamento.getNombre(),
                departamento.getArea(), Boolean.TRUE.equals(departamento.getActivo()));
    }
}
