package mx.nomina360.auth.config;

import mx.nomina360.auth.repositorio.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Limpieza diaria de refresh tokens expirados (evita crecimiento indefinido).
 */
@Component
public class LimpiezaTokens {

    private static final Logger log = LoggerFactory.getLogger(LimpiezaTokens.class);

    private final RefreshTokenRepository refreshTokens;

    public LimpiezaTokens(RefreshTokenRepository refreshTokens) {
        this.refreshTokens = refreshTokens;
    }

    @Scheduled(cron = "0 15 3 * * *")
    @Transactional
    public void purgarExpirados() {
        int eliminados = refreshTokens.purgarExpirados(Instant.now());
        if (eliminados > 0) {
            log.info("Refresh tokens expirados eliminados: {}", eliminados);
        }
    }
}
