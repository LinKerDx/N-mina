package mx.nomina360.rh.servicio;

import mx.nomina360.commons.web.api.PageResponse;
import mx.nomina360.commons.web.error.BusinessException;
import mx.nomina360.commons.web.error.ConflictException;
import mx.nomina360.commons.web.error.NotFoundException;
import mx.nomina360.rh.dominio.Departamento;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.Puesto;
import mx.nomina360.rh.dto.RespuestaEmpleado;
import mx.nomina360.rh.dto.SolicitudEmpleado;
import mx.nomina360.rh.repositorio.DepartamentoRepository;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import mx.nomina360.rh.repositorio.PuestoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EmpleadoService {

    private final EmpleadoRepository empleados;
    private final DepartamentoRepository departamentos;
    private final PuestoRepository puestos;

    public EmpleadoService(EmpleadoRepository empleados,
                           DepartamentoRepository departamentos,
                           PuestoRepository puestos) {
        this.empleados = empleados;
        this.departamentos = departamentos;
        this.puestos = puestos;
    }

    @Transactional
    public RespuestaEmpleado crear(SolicitudEmpleado solicitud) {
        if (empleados.existsByNumeroEmpleado(solicitud.numeroEmpleado().trim())) {
            throw new ConflictException("Ya existe un empleado con el numero " + solicitud.numeroEmpleado());
        }
        Empleado empleado = new Empleado();
        aplicar(empleado, solicitud);
        return mapear(empleados.save(empleado));
    }

    @Transactional
    public RespuestaEmpleado actualizar(UUID id, SolicitudEmpleado solicitud) {
        Empleado empleado = buscar(id);
        if (empleados.existsByNumeroEmpleadoAndIdNot(solicitud.numeroEmpleado().trim(), id)) {
            throw new ConflictException("Ya existe otro empleado con el numero " + solicitud.numeroEmpleado());
        }
        aplicar(empleado, solicitud);
        return mapear(empleados.save(empleado));
    }

    @Transactional
    public RespuestaEmpleado darDeBaja(UUID id, LocalDate fechaBaja) {
        Empleado empleado = buscar(id);
        if ("BAJA".equals(empleado.getEstatus())) {
            throw new ConflictException("El empleado ya está dado de baja");
        }
        empleado.setEstatus("BAJA");
        empleado.setFechaBaja(fechaBaja == null ? LocalDate.now() : fechaBaja);
        return mapear(empleados.save(empleado));
    }

    @Transactional
    public RespuestaEmpleado reingresar(UUID id, LocalDate fechaIngreso) {
        Empleado empleado = buscar(id);
        if (!"BAJA".equals(empleado.getEstatus())) {
            throw new ConflictException("Solo se puede reingresar a un empleado dado de baja");
        }
        LocalDate nuevoIngreso = fechaIngreso == null ? LocalDate.now() : fechaIngreso;
        if (empleado.getFechaBaja() != null && nuevoIngreso.isBefore(empleado.getFechaBaja())) {
            throw new BusinessException("FECHAS_INVALIDAS",
                    "La fecha de reingreso no puede ser anterior a la fecha de baja", HttpStatus.BAD_REQUEST);
        }
        empleado.setEstatus("ACTIVO");
        empleado.setFechaIngreso(nuevoIngreso);
        empleado.setFechaBaja(null);
        return mapear(empleados.save(empleado));
    }

    @Transactional
    public RespuestaEmpleado revertirBaja(UUID id) {
        Empleado empleado = buscar(id);
        if (!"BAJA".equals(empleado.getEstatus())) {
            throw new ConflictException("Solo se puede revertir la baja de un empleado dado de baja");
        }
        empleado.setEstatus("ACTIVO");
        empleado.setFechaBaja(null);
        return mapear(empleados.save(empleado));
    }

    @Transactional(readOnly = true)
    public RespuestaEmpleado obtener(UUID id) {
        return mapear(buscar(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<RespuestaEmpleado> buscar(String texto, String estatus, int pagina, int tamano) {
        Pageable pageable = PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamano, 1), 100),
                Sort.by(Sort.Direction.ASC, "apellidoPaterno").and(Sort.by("nombre")));

        Page<Empleado> page = empleados.findAll(construirFiltro(texto, estatus), pageable);

        Map<UUID, String> nombresDepartamento = departamentos.findAll().stream()
                .collect(Collectors.toMap(Departamento::getId, Departamento::getNombre));
        Map<UUID, String> nombresPuesto = puestos.findAll().stream()
                .collect(Collectors.toMap(Puesto::getId, Puesto::getNombre));

        List<RespuestaEmpleado> contenido = page.getContent().stream()
                .map(e -> RespuestaEmpleado.desde(e,
                        nombresDepartamento.get(e.getDepartamentoId()),
                        nombresPuesto.get(e.getPuestoId())))
                .toList();

        return PageResponse.de(contenido, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<mx.nomina360.rh.dto.RespuestaDepartamento> listarDepartamentos() {
        return departamentos.findAll().stream()
                .map(mx.nomina360.rh.dto.RespuestaDepartamento::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<mx.nomina360.rh.dto.RespuestaPuesto> listarPuestos() {
        return puestos.findAll().stream()
                .map(mx.nomina360.rh.dto.RespuestaPuesto::desde)
                .toList();
    }

    private Empleado buscar(UUID id) {
        return empleados.findById(id).orElseThrow(() -> new NotFoundException("El empleado no existe"));
    }

    private void aplicar(Empleado empleado, SolicitudEmpleado solicitud) {
        validarCatalogos(solicitud);

        empleado.setNumeroEmpleado(solicitud.numeroEmpleado().trim());
        empleado.setNombre(solicitud.nombre().trim());
        empleado.setApellidoPaterno(solicitud.apellidoPaterno().trim());
        empleado.setApellidoMaterno(limpiar(solicitud.apellidoMaterno()));
        empleado.setCurp(mayusculas(solicitud.curp()));
        empleado.setRfc(mayusculas(solicitud.rfc()));
        empleado.setNss(limpiar(solicitud.nss()));
        empleado.setEmail(limpiar(solicitud.email()));
        empleado.setTelefono(limpiar(solicitud.telefono()));
        empleado.setDepartamentoId(solicitud.departamentoId());
        empleado.setPuestoId(solicitud.puestoId());
        empleado.setTipoContrato(solicitud.tipoContrato() == null ? "INDEFINIDO" : solicitud.tipoContrato());
        empleado.setFechaIngreso(solicitud.fechaIngreso());
        empleado.setSalarioDiario(solicitud.salarioDiario());
        empleado.setEstatus(solicitud.estatus() == null ? "ACTIVO" : solicitud.estatus());

        if (!"BAJA".equals(empleado.getEstatus())) {
            empleado.setFechaBaja(null);
        } else if (empleado.getFechaBaja() == null) {
            empleado.setFechaBaja(LocalDate.now());
        }

        if (empleado.getFechaBaja() != null && empleado.getFechaBaja().isBefore(empleado.getFechaIngreso())) {
            throw new BusinessException("FECHAS_INVALIDAS",
                    "La fecha de baja no puede ser anterior a la fecha de ingreso", HttpStatus.BAD_REQUEST);
        }
    }

    private void validarCatalogos(SolicitudEmpleado solicitud) {
        if (solicitud.departamentoId() != null && !departamentos.existsById(solicitud.departamentoId())) {
            throw new BusinessException("DEPARTAMENTO_INEXISTENTE", "El departamento indicado no existe",
                    HttpStatus.BAD_REQUEST);
        }
        if (solicitud.puestoId() != null && !puestos.existsById(solicitud.puestoId())) {
            throw new BusinessException("PUESTO_INEXISTENTE", "El puesto indicado no existe",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private RespuestaEmpleado mapear(Empleado empleado) {
        String departamento = empleado.getDepartamentoId() == null ? null
                : departamentos.findById(empleado.getDepartamentoId()).map(Departamento::getNombre).orElse(null);
        String puesto = empleado.getPuestoId() == null ? null
                : puestos.findById(empleado.getPuestoId()).map(Puesto::getNombre).orElse(null);
        return RespuestaEmpleado.desde(empleado, departamento, puesto);
    }

    private Specification<Empleado> construirFiltro(String texto, String estatus) {
        Specification<Empleado> filtro = (root, query, cb) -> cb.conjunction();

        if (texto != null && !texto.isBlank()) {
            String patron = "%" + texto.trim().toLowerCase(Locale.ROOT) + "%";
            Specification<Empleado> porTexto = (root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("nombre")), patron),
                    cb.like(cb.lower(root.get("apellidoPaterno")), patron),
                    cb.like(cb.lower(root.get("numeroEmpleado")), patron),
                    cb.like(cb.lower(root.get("email")), patron));
            filtro = filtro.and(porTexto);
        }

        if (estatus != null && !estatus.isBlank()) {
            String estatusNormalizado = estatus.trim().toUpperCase(Locale.ROOT);
            Specification<Empleado> porEstatus = (root, query, cb) -> cb.equal(root.get("estatus"), estatusNormalizado);
            filtro = filtro.and(porEstatus);
        }

        return filtro;
    }

    private static String limpiar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private static String mayusculas(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim().toUpperCase(Locale.ROOT);
    }
}
