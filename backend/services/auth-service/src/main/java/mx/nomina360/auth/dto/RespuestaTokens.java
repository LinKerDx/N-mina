package mx.nomina360.auth.dto;

public record RespuestaTokens(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiraEnSegundos,
        RespuestaUsuario usuario) {
}
