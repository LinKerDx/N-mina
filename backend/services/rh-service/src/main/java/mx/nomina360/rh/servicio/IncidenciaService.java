package mx.nomina360.rh.servicio;

import mx.nomina360.commons.web.error.BusinessException;
import mx.nomina360.commons.web.error.NotFoundException;
import mx.nomina360.rh.dominio.Incidencia;
import mx.nomina360.rh.dto.RespuestaIncidencia;
import mx.nomina360.rh.dto.SolicitudIncidencia;
import mx.nomina360.rh.nomina.TiposIncidencia;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import mx.nomina360.rh.repositorio.IncidenciaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class IncidenciaService {

    private final IncidenciaRepository incidencias;
    private final EmpleadoRepository empleados;

    public IncidenciaService(IncidenciaRepository incidencias, EmpleadoRepository empleados) {
        this.incidencias = incidencias;
        this.empleados = empleados;
    }

    @Transactional
    public RespuestaIncidencia crear(SolicitudIncidencia solicitud) {
        if (!TiposIncidencia.VALIDOS.contains(solicitud.tipo())) {
            throw new BusinessException("TIPO_INCIDENCIA_INVALIDO",
                    "El tipo de incidencia no es valido", HttpStatus.BAD_REQUEST);
        }
        if (!empleados.existsById(solicitud.empleadoId())) {
            throw new NotFoundException("El empleado no existe");
        }

        Incidencia incidencia = new Incidencia();
        incidencia.setEmpleadoId(solicitud.empleadoId());
        incidencia.setTipo(solicitud.tipo());
        incidencia.setFecha(solicitud.fecha());
        incidencia.setCantidad(solicitud.cantidad());
        incidencia.setMotivo(solicitud.motivo());
        incidencia.setAutorizada(true);
        incidencia.setOrigen("MANUAL");

        return RespuestaIncidencia.desde(incidencias.save(incidencia));
    }

    @Transactional(readOnly = true)
    public List<RespuestaIncidencia> listar(UUID empleadoId, LocalDate desde, LocalDate hasta) {
        LocalDate inicio = desde != null ? desde : LocalDate.now().withDayOfMonth(1);
        LocalDate fin = hasta != null ? hasta : LocalDate.now();

        List<Incidencia> resultado = empleadoId != null
                ? incidencias.findByEmpleadoIdAndFechaBetweenOrderByFechaAsc(empleadoId, inicio, fin)
                : incidencias.findByFechaBetweenOrderByFechaAsc(inicio, fin);

        return resultado.stream().map(RespuestaIncidencia::desde).toList();
    }
}
