package mx.nomina360.administracion.dto;

import mx.nomina360.administracion.dominio.Pago;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RespuestaPago(
        UUID id,
        String folio,
        String tipo,
        String referenciaExterna,
        UUID proveedorId,
        UUID centroCostoId,
        UUID periodoNominaId,
        BigDecimal monto,
        String moneda,
        LocalDate fechaPago,
        String estatus) {

    public static RespuestaPago desde(Pago pago) {
        return new RespuestaPago(pago.getId(), pago.getFolio(), pago.getTipo(), pago.getReferenciaExterna(),
                pago.getProveedorId(), pago.getCentroCostoId(), pago.getPeriodoNominaId(), pago.getMonto(),
                pago.getMoneda(), pago.getFechaPago(), pago.getEstatus());
    }
}
