package mx.nomina360.commons.web.api;

import java.util.List;

/**
 * Envoltura de paginacion estable para el frontend.
 */
public record PageResponse<T>(
        List<T> contenido,
        int pagina,
        int tamano,
        long totalElementos,
        int totalPaginas) {

    public static <T> PageResponse<T> de(List<T> contenido, int pagina, int tamano, long totalElementos) {
        int totalPaginas = tamano <= 0 ? 0 : (int) Math.ceil((double) totalElementos / tamano);
        return new PageResponse<>(List.copyOf(contenido), pagina, tamano, totalElementos, totalPaginas);
    }
}
