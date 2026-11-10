package mx.nomina360.auth.repositorio;

import mx.nomina360.auth.dominio.MensajeChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface MensajeChatRepository extends JpaRepository<MensajeChat, UUID> {
    @Query("select m from MensajeChat m where (m.remitenteId=:a and m.destinatarioId=:b) or (m.remitenteId=:b and m.destinatarioId=:a) order by m.enviadoEn asc")
    List<MensajeChat> conversacion(UUID a, UUID b);
}
