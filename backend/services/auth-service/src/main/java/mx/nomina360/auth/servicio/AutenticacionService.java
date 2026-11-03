package mx.nomina360.auth.servicio;

import mx.nomina360.auth.dominio.RefreshToken;
import mx.nomina360.auth.dominio.Usuario;
import mx.nomina360.auth.dto.RespuestaTokens;
import mx.nomina360.auth.dto.RespuestaUsuario;
import mx.nomina360.auth.repositorio.RefreshTokenRepository;
import mx.nomina360.auth.repositorio.UsuarioRepository;
import mx.nomina360.commons.jwt.JwtService;
import mx.nomina360.commons.jwt.UsuarioJwt;
import mx.nomina360.commons.web.error.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Reglas de autenticacion: credenciales, emision y rotacion de tokens.
 */
@Service
public class AutenticacionService {

    private static final Logger log = LoggerFactory.getLogger(AutenticacionService.class);

    private final UsuarioRepository usuarios;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SecureRandom aleatorio = new SecureRandom();

    public AutenticacionService(UsuarioRepository usuarios,
                                RefreshTokenRepository refreshTokens,
                                PasswordEncoder passwordEncoder,
                                JwtService jwtService) {
        this.usuarios = usuarios;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public RespuestaTokens iniciarSesion(String email, String password) {
        Usuario usuario = usuarios.findByEmailIgnoreCase(email)
                .orElseThrow(AutenticacionService::credencialesInvalidas);

        if (!Boolean.TRUE.equals(usuario.getActivo())
                || !passwordEncoder.matches(password, usuario.getPasswordHash())) {
            log.warn("Intento de login fallido para {}", email);
            throw credencialesInvalidas();
        }

        log.info("Login exitoso usuario={} rol={}", usuario.getEmail(), usuario.getRol());
        return emitirTokens(usuario);
    }

    /**
     * Rotacion de refresh token: el token usado queda revocado y se emite uno nuevo.
     */
    @Transactional
    public RespuestaTokens refrescar(String token) {
        RefreshToken almacenado = refreshTokens.findByTokenHash(hash(token))
                .orElseThrow(() -> new BusinessException("REFRESH_INVALIDO",
                        "La sesion no es valida, inicia sesion de nuevo", HttpStatus.UNAUTHORIZED));

        if (Boolean.TRUE.equals(almacenado.getRevocado())
                || almacenado.getExpiraEn().isBefore(Instant.now())) {
            throw new BusinessException("REFRESH_EXPIRADO",
                    "La sesion expiro, inicia sesion de nuevo", HttpStatus.UNAUTHORIZED);
        }

        almacenado.setRevocado(true);
        refreshTokens.save(almacenado);

        Usuario usuario = usuarios.findById(almacenado.getUsuarioId())
                .filter(u -> Boolean.TRUE.equals(u.getActivo()))
                .orElseThrow(() -> new BusinessException("USUARIO_INACTIVO",
                        "El usuario ya no esta activo", HttpStatus.UNAUTHORIZED));

        return emitirTokens(usuario);
    }

    @Transactional
    public void cerrarSesion(String token) {
        refreshTokens.findByTokenHash(hash(token)).ifPresent(almacenado -> {
            almacenado.setRevocado(true);
            refreshTokens.save(almacenado);
        });
    }

    @Transactional(readOnly = true)
    public RespuestaUsuario perfil(UUID usuarioId) {
        return usuarios.findById(usuarioId)
                .map(RespuestaUsuario::desde)
                .orElseThrow(() -> new BusinessException("USUARIO_NO_ENCONTRADO",
                        "El usuario no existe", HttpStatus.NOT_FOUND));
    }

    private RespuestaTokens emitirTokens(Usuario usuario) {
        String accessToken = jwtService.crearAccessToken(new UsuarioJwt(
                usuario.getId(), usuario.getEmail(), usuario.getRol(), usuario.getArea()));

        String refreshToken = nuevoTokenOpaco();
        RefreshToken entidad = new RefreshToken();
        entidad.setUsuarioId(usuario.getId());
        entidad.setTokenHash(hash(refreshToken));
        entidad.setExpiraEn(Instant.now().plus(jwtService.diasVigenciaRefreshToken(), ChronoUnit.DAYS));
        refreshTokens.save(entidad);

        return new RespuestaTokens(accessToken, refreshToken, "Bearer",
                jwtService.minutosVigenciaAccessToken() * 60, RespuestaUsuario.desde(usuario));
    }

    private String nuevoTokenOpaco() {
        byte[] bytes = new byte[32];
        aleatorio.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String valor) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(valor.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 no disponible", ex);
        }
    }

    private static BusinessException credencialesInvalidas() {
        return new BusinessException("CREDENCIALES_INVALIDAS",
                "Correo o contrasena incorrectos", HttpStatus.UNAUTHORIZED);
    }
}
