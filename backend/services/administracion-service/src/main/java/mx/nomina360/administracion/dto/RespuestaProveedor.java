package mx.nomina360.administracion.dto;

import mx.nomina360.administracion.dominio.Proveedor;

import java.util.UUID;

public record RespuestaProveedor(UUID id, String rfc, String razonSocial, String email, boolean activo) {

    public static RespuestaProveedor desde(Proveedor proveedor) {
        return new RespuestaProveedor(proveedor.getId(), proveedor.getRfc(), proveedor.getRazonSocial(),
                proveedor.getEmail(), Boolean.TRUE.equals(proveedor.getActivo()));
    }
}
