package mx.nomina360.rh.servicio;

import mx.nomina360.commons.web.error.BusinessException;
import mx.nomina360.commons.web.error.ConflictException;
import mx.nomina360.commons.web.error.NotFoundException;
import mx.nomina360.rh.dominio.AjusteNomina;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.PeriodoNomina;
import mx.nomina360.rh.dto.RespuestaAjusteNomina;
import mx.nomina360.rh.dto.SolicitudAjusteNomina;
import mx.nomina360.rh.repositorio.AjusteNominaRepository;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import mx.nomina360.rh.repositorio.PeriodoNominaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AjusteNominaService {

    private static final String BORRADOR = "BORRADOR";
    private final AjusteNominaRepository ajustes;
    private final PeriodoNominaRepository periodos;
    private final EmpleadoRepository empleados;

    public AjusteNominaService(AjusteNominaRepository ajustes,
                               PeriodoNominaRepository periodos,
                               EmpleadoRepository empleados) {
        this.ajustes = ajustes;
        this.periodos = periodos;
        this.empleados = empleados;
    }

    @Transactional(readOnly = true)
    public List<RespuestaAjusteNomina> listar(UUID periodoId) {
        buscarPeriodo(periodoId);
        return ajustes.findByPeriodoIdOrderByCreadoEnAsc(periodoId).stream()
                .map(ajuste -> RespuestaAjusteNomina.desde(ajuste, buscarEmpleado(ajuste.getEmpleadoId()).nombreCompleto()))
                .toList();
    }

    @Transactional
    public RespuestaAjusteNomina crear(UUID periodoId, SolicitudAjusteNomina solicitud) {
        PeriodoNomina periodo = buscarPeriodo(periodoId);
        validarBorrador(periodo);
        Empleado empleado = buscarEmpleado(solicitud.empleadoId());
        if (!"ACTIVO".equals(empleado.getEstatus())) {
            throw new BusinessException("EMPLEADO_INACTIVO",
                    "Solo se pueden agregar conceptos a empleados activos", HttpStatus.BAD_REQUEST);
        }
        if (empleado.getFechaIngreso().isAfter(periodo.getFechaFin())) {
            throw new BusinessException("EMPLEADO_FUERA_DEL_PERIODO",
                    "La fecha de ingreso del empleado es posterior al periodo seleccionado", HttpStatus.BAD_REQUEST);
        }
        if ("DEDUCCION".equals(solicitud.tipo())
                && Boolean.TRUE.equals(solicitud.gravable())) {
            throw new BusinessException("DEDUCCION_GRAVABLE_INVALIDA",
                    "Una deduccion no puede marcarse como gravable", HttpStatus.BAD_REQUEST);
        }

        AjusteNomina ajuste = new AjusteNomina();
        ajuste.setPeriodoId(periodoId);
        ajuste.setEmpleadoId(empleado.getId());
        ajuste.setTipo(solicitud.tipo());
        ajuste.setDescripcion(solicitud.descripcion().trim());
        ajuste.setImporte(solicitud.importe());
        ajuste.setGravable("PERCEPCION".equals(solicitud.tipo()) && Boolean.TRUE.equals(solicitud.gravable()));
        return RespuestaAjusteNomina.desde(ajustes.save(ajuste), empleado.nombreCompleto());
    }

    @Transactional
    public void eliminar(UUID id) {
        AjusteNomina ajuste = ajustes.findById(id)
                .orElseThrow(() -> new NotFoundException("El concepto de nomina no existe"));
        validarBorrador(buscarPeriodo(ajuste.getPeriodoId()));
        ajustes.delete(ajuste);
    }

    private PeriodoNomina buscarPeriodo(UUID id) {
        return periodos.findById(id).orElseThrow(() -> new NotFoundException("El periodo de nomina no existe"));
    }

    private Empleado buscarEmpleado(UUID id) {
        return empleados.findById(id).orElseThrow(() -> new NotFoundException("El empleado no existe"));
    }

    private void validarBorrador(PeriodoNomina periodo) {
        if (!BORRADOR.equals(periodo.getEstatus())) {
            throw new ConflictException("Los conceptos solo se pueden modificar mientras el periodo esta en borrador");
        }
    }
}
