package mx.nomina360.produccion.servicio;

import mx.nomina360.commons.web.error.ConflictException;
import mx.nomina360.produccion.dominio.MarcacionAsistencia;
import mx.nomina360.produccion.dominio.OrigenMarcacion;
import mx.nomina360.produccion.dto.RespuestaMarcacion;
import mx.nomina360.produccion.dto.SolicitudMarcacion;
import mx.nomina360.produccion.repositorio.MarcacionAsistenciaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MarcacionAsistenciaService {

    private final MarcacionAsistenciaRepository marcaciones;

    public MarcacionAsistenciaService(MarcacionAsistenciaRepository marcaciones) {
        this.marcaciones = marcaciones;
    }

    /**
     * Persiste eventos normalizados. La clave externa hace idempotentes los reintentos
     * típicos de los relojes checadores y sus conectores.
     */
    @Transactional
    public RespuestaMarcacion recibir(SolicitudMarcacion solicitud) {
        var existente = marcaciones.findByDispositivoIdAndEventoDispositivoId(
                solicitud.dispositivoId(), solicitud.eventoDispositivoId());
        if (existente.isPresent()) {
            MarcacionAsistencia guardada = existente.get();
            boolean mismoEvento = guardada.getEmpleadoId().equals(solicitud.empleadoId())
                    && guardada.getTipo() == solicitud.tipo()
                    && guardada.getOcurridoEn().equals(solicitud.ocurridoEn().toInstant());
            if (!mismoEvento) {
                throw new ConflictException("El identificador del evento ya fue usado con otros datos");
            }
            return RespuestaMarcacion.desde(guardada);
        }

        MarcacionAsistencia marcacion = new MarcacionAsistencia();
        marcacion.setEmpleadoId(solicitud.empleadoId());
        marcacion.setEmpleadoNombre(solicitud.empleadoNombre().trim());
        marcacion.setNumeroEmpleado(solicitud.numeroEmpleado() == null ? null : solicitud.numeroEmpleado().trim());
        marcacion.setTipo(solicitud.tipo());
        marcacion.setOcurridoEn(solicitud.ocurridoEn().toInstant());
        marcacion.setOrigen(OrigenMarcacion.DISPOSITIVO);
        marcacion.setDispositivoId(solicitud.dispositivoId().trim());
        marcacion.setEventoDispositivoId(solicitud.eventoDispositivoId().trim());
        return RespuestaMarcacion.desde(marcaciones.save(marcacion));
    }

    @Transactional(readOnly = true)
    public List<RespuestaMarcacion> listar(UUID empleadoId, Instant desde, Instant hasta) {
        return marcaciones.findByEmpleadoIdAndOcurridoEnBetweenOrderByOcurridoEnAsc(
                        empleadoId, desde, hasta).stream()
                .map(RespuestaMarcacion::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RespuestaMarcacion> listarPropias(String numeroEmpleado, Instant desde, Instant hasta) {
        return marcaciones.findByNumeroEmpleadoAndOcurridoEnBetweenOrderByOcurridoEnAsc(
                        numeroEmpleado, desde, hasta).stream()
                .map(RespuestaMarcacion::desde)
                .toList();
    }
}
