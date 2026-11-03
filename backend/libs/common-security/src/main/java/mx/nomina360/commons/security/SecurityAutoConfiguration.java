package mx.nomina360.commons.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import mx.nomina360.commons.jwt.JwtAutoConfiguration;
import mx.nomina360.commons.jwt.JwtService;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@AutoConfiguration(after = JwtAutoConfiguration.class)
@ConditionalOnClass(SecurityFilterChain.class)
@EnableConfigurationProperties(HttpSecurityProperties.class)
public class SecurityAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    @ConditionalOnMissingBean
    public ManejadorErroresSeguridad manejadorErroresSeguridad() {
        return new ManejadorErroresSeguridad();
    }

    @Bean
    @ConditionalOnMissingBean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService, ObjectMapper objectMapper) {
        return new JwtAuthenticationFilter(jwtService, objectMapper);
    }

    @Bean
    @ConditionalOnMissingBean(SecurityFilterChain.class)
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthenticationFilter jwtAuthenticationFilter,
                                                   HttpSecurityProperties propiedades,
                                                   ObjectMapper objectMapper) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(autorizacion -> autorizacion
                        .requestMatchers(propiedades.publicPaths().toArray(String[]::new)).permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(excepciones -> excepciones
                        .authenticationEntryPoint((request, response, ex) -> SeguridadRespuestas.escribir(
                                response, objectMapper, HttpStatus.UNAUTHORIZED.value(), "NO_AUTENTICADO",
                                "Se requiere un token valido", request.getRequestURI()))
                        .accessDeniedHandler((request, response, ex) -> SeguridadRespuestas.escribir(
                                response, objectMapper, HttpStatus.FORBIDDEN.value(), "ACCESO_DENEGADO",
                                "No tienes permisos para esta operacion", request.getRequestURI())))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
