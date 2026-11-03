package mx.nomina360.commons.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import mx.nomina360.commons.jwt.JwtService;
import mx.nomina360.commons.jwt.UsuarioJwt;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Autentica la peticion a partir del header Authorization: Bearer &lt;JWT&gt;.
 * Si el token es invalido responde 401 con el contrato ApiError.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(JwtService jwtService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String cabecera = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (cabecera == null || !cabecera.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            UsuarioJwt usuario = jwtService.validar(cabecera.substring(7).trim());
            UsernamePasswordAuthenticationToken autenticacion = new UsernamePasswordAuthenticationToken(
                    usuario, null, List.of(new SimpleGrantedAuthority(Roles.autoridad(usuario.rol()))));
            autenticacion.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(autenticacion);
            MDC.put("usuarioId", usuario.id().toString());
            chain.doFilter(request, response);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            SeguridadRespuestas.escribir(response, objectMapper, HttpStatus.UNAUTHORIZED.value(),
                    "TOKEN_INVALIDO", "El token es invalido o expiro", request.getRequestURI());
        } finally {
            MDC.remove("usuarioId");
        }
    }
}
