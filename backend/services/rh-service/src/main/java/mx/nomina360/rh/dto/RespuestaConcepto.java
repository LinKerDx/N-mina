package mx.nomina360.rh.dto;

import java.math.BigDecimal;

public record RespuestaConcepto(
        String tipo,
        String clave,
        String descripcion,
        BigDecimal importe,
        boolean gravable) {
}
