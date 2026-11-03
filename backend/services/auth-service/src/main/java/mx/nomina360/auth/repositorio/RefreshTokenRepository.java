package mx.nomina360.auth.repositorio;

import mx.nomina360.auth.dominio.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshToken rt set rt.revocado = true where rt.usuarioId = :usuarioId and rt.revocado = false")
    int revocarTodosDeUsuario(@Param("usuarioId") UUID usuarioId);

    @Modifying
    @Query("delete from RefreshToken rt where rt.expiraEn < :limite")
    int purgarExpirados(@Param("limite") Instant limite);
}
