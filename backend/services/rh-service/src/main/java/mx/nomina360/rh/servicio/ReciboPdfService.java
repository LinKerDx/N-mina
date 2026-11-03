package mx.nomina360.rh.servicio;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import mx.nomina360.commons.web.error.NotFoundException;
import mx.nomina360.rh.dominio.ConceptoNomina;
import mx.nomina360.rh.dominio.Departamento;
import mx.nomina360.rh.dominio.Empleado;
import mx.nomina360.rh.dominio.PeriodoNomina;
import mx.nomina360.rh.dominio.Puesto;
import mx.nomina360.rh.dominio.ReciboNomina;
import mx.nomina360.rh.repositorio.ConceptoNominaRepository;
import mx.nomina360.rh.repositorio.DepartamentoRepository;
import mx.nomina360.rh.repositorio.EmpleadoRepository;
import mx.nomina360.rh.repositorio.PeriodoNominaRepository;
import mx.nomina360.rh.repositorio.PuestoRepository;
import mx.nomina360.rh.repositorio.ReciboNominaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Genera el recibo de nómina en PDF: desglose de percepciones y deducciones más
 * los datos completos del trabajador (CURP, RFC, NSS, puesto, departamento…).
 *
 * <p>El PDF se arma en el backend porque los datos personales viven en {@code rh_db}
 * y no deben viajar al navegador sólo para imprimirlos.
 */
@Service
public class ReciboPdfService {

    private static final Color VERDE = new Color(5, 150, 105);
    private static final Color GRIS = new Color(100, 116, 139);
    private static final Color GRIS_CLARO = new Color(241, 245, 249);
    private static final Color VERDE_CLARO = new Color(236, 253, 245);

    private static final Font TITULO_MARCA = new Font(Font.HELVETICA, 19, Font.BOLD, VERDE);
    private static final Font TITULO_DOCUMENTO = new Font(Font.HELVETICA, 12, Font.BOLD, Color.BLACK);
    private static final Font SECCION = new Font(Font.HELVETICA, 9, Font.BOLD, VERDE);
    private static final Font ETIQUETA = new Font(Font.HELVETICA, 7.5f, Font.BOLD, GRIS);
    private static final Font VALOR = new Font(Font.HELVETICA, 8.5f, Font.NORMAL, Color.BLACK);
    private static final Font ENCABEZADO_TABLA = new Font(Font.HELVETICA, 7.5f, Font.BOLD, Color.WHITE);
    private static final Font CELDA_TABLA = new Font(Font.HELVETICA, 8.5f, Font.NORMAL, Color.BLACK);
    private static final Font CELDA_NEGRITA = new Font(Font.HELVETICA, 8.5f, Font.BOLD, Color.BLACK);
    private static final Font NOTA = new Font(Font.HELVETICA, 7f, Font.NORMAL, GRIS);
    private static final Font TOTAL_NETO = new Font(Font.HELVETICA, 11, Font.BOLD, VERDE);

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale LOCALE_MX = Locale.forLanguageTag("es-MX");

    private final ReciboNominaRepository recibos;
    private final ConceptoNominaRepository conceptos;
    private final EmpleadoRepository empleados;
    private final PeriodoNominaRepository periodos;
    private final DepartamentoRepository departamentos;
    private final PuestoRepository puestos;

    public ReciboPdfService(ReciboNominaRepository recibos,
                            ConceptoNominaRepository conceptos,
                            EmpleadoRepository empleados,
                            PeriodoNominaRepository periodos,
                            DepartamentoRepository departamentos,
                            PuestoRepository puestos) {
        this.recibos = recibos;
        this.conceptos = conceptos;
        this.empleados = empleados;
        this.periodos = periodos;
        this.departamentos = departamentos;
        this.puestos = puestos;
    }

    @Transactional(readOnly = true)
    public DocumentoPdf generar(UUID reciboId) {
        ReciboNomina recibo = recibos.findById(reciboId)
                .orElseThrow(() -> new NotFoundException("El recibo de nomina no existe"));
        PeriodoNomina periodo = periodos.findById(recibo.getPeriodoId()).orElse(null);
        Empleado empleado = empleados.findById(recibo.getEmpleadoId()).orElse(null);
        List<ConceptoNomina> conceptosRecibo = conceptos.findByReciboIdOrderByOrdenAsc(recibo.getId());

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.LETTER, 42, 42, 38, 38);

        try {
            PdfWriter.getInstance(documento, salida);
            documento.addTitle("Recibo de nomina " + recibo.getNumeroEmpleado());
            documento.addAuthor("Nomina360");
            documento.addCreator("Nomina360");
            documento.open();

            documento.add(cabecera(recibo));
            documento.add(tituloSeccion("Datos del trabajador"));
            documento.add(datosTrabajador(recibo, empleado, periodo));
            documento.add(tituloSeccion("Periodo de pago"));
            documento.add(datosPeriodo(periodo));
            documento.add(tituloSeccion("Percepciones"));
            documento.add(tablaConceptos(conceptosRecibo, "PERCEPCION", recibo.getTotalPercepciones()));
            documento.add(tituloSeccion("Deducciones"));
            documento.add(tablaConceptos(conceptosRecibo, "DEDUCCION", recibo.getTotalDeducciones()));
            documento.add(totales(recibo));
            documento.add(pie());

            documento.close();
        } catch (DocumentException excepcion) {
            throw new IllegalStateException("No se pudo generar el recibo en PDF", excepcion);
        } finally {
            if (documento.isOpen()) {
                documento.close();
            }
        }

        return new DocumentoPdf(salida.toByteArray(), nombreArchivo(recibo, periodo));
    }

    private PdfPTable cabecera(ReciboNomina recibo) throws DocumentException {
        PdfPTable tabla = new PdfPTable(new float[]{3f, 2f});
        tabla.setWidthPercentage(100);
        tabla.setSpacingAfter(6);

        PdfPCell marca = new PdfPCell();
        marca.setBorder(Rectangle.NO_BORDER);
        marca.addElement(new Paragraph("Nomina360", TITULO_MARCA));
        marca.addElement(new Paragraph("Sistema de control de nominas", new Font(Font.HELVETICA, 8.5f,
                Font.NORMAL, GRIS)));
        tabla.addCell(marca);

        PdfPCell referencia = new PdfPCell();
        referencia.setBorder(Rectangle.NO_BORDER);
        referencia.setHorizontalAlignment(Element.ALIGN_RIGHT);
        referencia.addElement(new Paragraph("RECIBO DE NOMINA", TITULO_DOCUMENTO));
        referencia.addElement(new Paragraph("Folio " + recibo.getId().toString().substring(0, 8).toUpperCase(LOCALE_MX),
                new Font(Font.HELVETICA, 8, Font.NORMAL, GRIS)));
        tabla.addCell(referencia);

        return tabla;
    }

    private PdfPTable datosTrabajador(ReciboNomina recibo, Empleado empleado, PeriodoNomina periodo)
            throws DocumentException {
        String departamento = nombreDepartamento(empleado);
        String puesto = nombrePuesto(empleado);

        PdfPTable tabla = tablaDatos();
        agregarDato(tabla, "Numero de empleado", recibo.getNumeroEmpleado());
        agregarDato(tabla, "Nombre completo", recibo.getNombreEmpleado());
        agregarDato(tabla, "CURP", valor(empleado == null ? null : empleado.getCurp()));
        agregarDato(tabla, "RFC", valor(empleado == null ? null : empleado.getRfc()));
        agregarDato(tabla, "NSS", valor(empleado == null ? null : empleado.getNss()));
        agregarDato(tabla, "Correo", valor(empleado == null ? null : empleado.getEmail()));
        agregarDato(tabla, "Telefono", valor(empleado == null ? null : empleado.getTelefono()));
        agregarDato(tabla, "Departamento", departamento);
        agregarDato(tabla, "Puesto", puesto);
        agregarDato(tabla, "Tipo de contrato", valor(empleado == null ? null : empleado.getTipoContrato()));
        agregarDato(tabla, "Fecha de ingreso", empleado == null || empleado.getFechaIngreso() == null
                ? "—" : FECHA.format(empleado.getFechaIngreso()));
        agregarDato(tabla, "Salario diario", empleado == null ? "—" : dinero(empleado.getSalarioDiario()));
        agregarDato(tabla, "Estatus", valor(empleado == null ? null : empleado.getEstatus()));
        agregarDato(tabla, "Dias pagados",
                recibo.getDiasPagados() == null ? "—" : recibo.getDiasPagados().stripTrailingZeros().toPlainString());
        return tabla;
    }

    private PdfPTable datosPeriodo(PeriodoNomina periodo) throws DocumentException {
        PdfPTable tabla = tablaDatos();
        if (periodo == null) {
            agregarDato(tabla, "Periodo", "No disponible");
            agregarDato(tabla, "Estatus", "—");
            return tabla;
        }
        agregarDato(tabla, "Periodo", periodo.getNombre());
        agregarDato(tabla, "Tipo", periodo.getTipo());
        agregarDato(tabla, "Inicio", FECHA.format(periodo.getFechaInicio()));
        agregarDato(tabla, "Fin", FECHA.format(periodo.getFechaFin()));
        agregarDato(tabla, "Fecha de pago", FECHA.format(periodo.getFechaPago()));
        agregarDato(tabla, "Estatus", periodo.getEstatus());
        return tabla;
    }

    private PdfPTable tablaConceptos(List<ConceptoNomina> conceptosRecibo, String tipo, BigDecimal total)
            throws DocumentException {
        List<ConceptoNomina> filtrados = conceptosRecibo.stream()
                .filter(concepto -> tipo.equals(concepto.getTipo()))
                .toList();

        PdfPTable tabla = new PdfPTable(new float[]{1.1f, 7.5f, 1.4f, 2.2f});
        tabla.setWidthPercentage(100);
        tabla.setSpacingAfter(4);

        tabla.addCell(celdaEncabezado("Clave"));
        tabla.addCell(celdaEncabezado("Concepto"));
        tabla.addCell(celdaEncabezado("Gravable"));
        tabla.addCell(celdaEncabezado("Importe", Element.ALIGN_RIGHT));

        if (filtrados.isEmpty()) {
            PdfPCell vacio = new PdfPCell(new Phrase("Sin conceptos registrados", NOTA));
            vacio.setColspan(4);
            vacio.setPadding(6);
            vacio.setBorderColor(GRIS_CLARO);
            tabla.addCell(vacio);
        }

        for (ConceptoNomina concepto : filtrados) {
            tabla.addCell(celdaTexto(concepto.getClave(), Element.ALIGN_LEFT));
            tabla.addCell(celdaTexto(concepto.getDescripcion(), Element.ALIGN_LEFT));
            tabla.addCell(celdaTexto(Boolean.TRUE.equals(concepto.getGravable()) ? "Si" : "No", Element.ALIGN_CENTER));
            tabla.addCell(celdaTexto(dinero(concepto.getImporte()), Element.ALIGN_RIGHT));
        }

        PdfPCell etiquetaTotal = new PdfPCell(new Phrase("Subtotal", CELDA_NEGRITA));
        etiquetaTotal.setColspan(3);
        etiquetaTotal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        etiquetaTotal.setBackgroundColor(GRIS_CLARO);
        etiquetaTotal.setPadding(5);
        tabla.addCell(etiquetaTotal);

        PdfPCell valorTotal = new PdfPCell(new Phrase(dinero(total), CELDA_NEGRITA));
        valorTotal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valorTotal.setBackgroundColor(GRIS_CLARO);
        valorTotal.setPadding(5);
        tabla.addCell(valorTotal);

        return tabla;
    }

    private PdfPTable totales(ReciboNomina recibo) throws DocumentException {
        PdfPTable tabla = new PdfPTable(new float[]{3f, 2f});
        tabla.setWidthPercentage(48);
        tabla.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.setSpacingBefore(10);

        agregarTotal(tabla, "Total percepciones", dinero(recibo.getTotalPercepciones()), false);
        agregarTotal(tabla, "Total deducciones", dinero(recibo.getTotalDeducciones()), false);

        PdfPCell etiquetaNeto = new PdfPCell(new Phrase("NETO A PAGAR", new Font(Font.HELVETICA, 9,
                Font.BOLD, VERDE)));
        etiquetaNeto.setBackgroundColor(VERDE_CLARO);
        etiquetaNeto.setPadding(7);
        etiquetaNeto.setBorderColor(VERDE);
        tabla.addCell(etiquetaNeto);

        PdfPCell valorNeto = new PdfPCell(new Phrase(dinero(recibo.getNeto()), TOTAL_NETO));
        valorNeto.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valorNeto.setBackgroundColor(VERDE_CLARO);
        valorNeto.setPadding(7);
        valorNeto.setBorderColor(VERDE);
        tabla.addCell(valorNeto);

        return tabla;
    }

    private Paragraph pie() {
        Paragraph nota = new Paragraph("Documento generado el "
                + FECHA_HORA.format(Instant.now().atZone(ZoneId.systemDefault()))
                + " · Nomina360 · Recibo informativo; no sustituye al CFDI de nomina.", NOTA);
        nota.setSpacingBefore(16);
        return nota;
    }

    private PdfPTable tablaDatos() throws DocumentException {
        PdfPTable tabla = new PdfPTable(new float[]{1.35f, 2.4f, 1.35f, 2.4f});
        tabla.setWidthPercentage(100);
        tabla.setSpacingAfter(2);
        return tabla;
    }

    private void agregarDato(PdfPTable tabla, String etiqueta, String valor) {
        PdfPCell celdaEtiqueta = new PdfPCell(new Phrase(etiqueta.toUpperCase(LOCALE_MX), ETIQUETA));
        celdaEtiqueta.setBorderColor(GRIS_CLARO);
        celdaEtiqueta.setPadding(4);
        celdaEtiqueta.setBackgroundColor(GRIS_CLARO);

        PdfPCell celdaValor = new PdfPCell(new Phrase(valor, VALOR));
        celdaValor.setBorderColor(GRIS_CLARO);
        celdaValor.setPadding(4);

        tabla.addCell(celdaEtiqueta);
        tabla.addCell(celdaValor);
    }

    private void agregarTotal(PdfPTable tabla, String etiqueta, String valor, boolean destacado) {
        Font fuente = destacado ? CELDA_NEGRITA : VALOR;
        PdfPCell celdaEtiqueta = new PdfPCell(new Phrase(etiqueta, fuente));
        celdaEtiqueta.setBorderColor(GRIS_CLARO);
        celdaEtiqueta.setPadding(5);
        PdfPCell celdaValor = new PdfPCell(new Phrase(valor, fuente));
        celdaValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
        celdaValor.setBorderColor(GRIS_CLARO);
        celdaValor.setPadding(5);
        tabla.addCell(celdaEtiqueta);
        tabla.addCell(celdaValor);
    }

    private PdfPCell celdaEncabezado(String texto) {
        return celdaEncabezado(texto, Element.ALIGN_LEFT);
    }

    private PdfPCell celdaEncabezado(String texto, int alineacion) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, ENCABEZADO_TABLA));
        celda.setBackgroundColor(new Color(15, 23, 42));
        celda.setHorizontalAlignment(alineacion);
        celda.setPadding(5);
        celda.setBorderColor(new Color(15, 23, 42));
        return celda;
    }

    private PdfPCell celdaTexto(String texto, int alineacion) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, CELDA_TABLA));
        celda.setHorizontalAlignment(alineacion);
        celda.setPadding(4);
        celda.setBorderColor(GRIS_CLARO);
        return celda;
    }

    private Paragraph tituloSeccion(String texto) {
        Paragraph parrafo = new Paragraph(texto.toUpperCase(LOCALE_MX), SECCION);
        parrafo.setSpacingBefore(11);
        parrafo.setSpacingAfter(3);
        return parrafo;
    }

    private String nombreDepartamento(Empleado empleado) {
        if (empleado == null || empleado.getDepartamentoId() == null) {
            return "—";
        }
        return departamentos.findById(empleado.getDepartamentoId())
                .map(Departamento::getNombre)
                .orElse("—");
    }

    private String nombrePuesto(Empleado empleado) {
        if (empleado == null || empleado.getPuestoId() == null) {
            return "—";
        }
        return puestos.findById(empleado.getPuestoId())
                .map(Puesto::getNombre)
                .orElse("—");
    }

    private static String valor(String texto) {
        return texto == null || texto.isBlank() ? "—" : texto;
    }

    private static String dinero(BigDecimal importe) {
        if (importe == null) {
            return "—";
        }
        return NumberFormat.getCurrencyInstance(LOCALE_MX).format(importe);
    }

    private static String nombreArchivo(ReciboNomina recibo, PeriodoNomina periodo) {
        String periodoTexto = periodo == null ? LocalDate.now().toString() : periodo.getNombre();
        String base = "recibo-" + recibo.getNumeroEmpleado() + "-" + periodoTexto;
        return base.replaceAll("[^A-Za-z0-9]+", "-").replaceAll("^-|-$", "") + ".pdf";
    }

    public record DocumentoPdf(byte[] contenido, String nombreArchivo) {
    }
}
