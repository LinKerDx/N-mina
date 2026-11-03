package mx.nomina360.commons.web.config;

import mx.nomina360.commons.web.error.GlobalExceptionHandler;
import mx.nomina360.commons.web.web.CorrelationIdFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;

@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class CommonWebAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public FilterRegistrationBean<CorrelationIdFilter> filtroCorrelacion() {
        FilterRegistrationBean<CorrelationIdFilter> registro = new FilterRegistrationBean<>(new CorrelationIdFilter());
        registro.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registro.addUrlPatterns("/*");
        return registro;
    }

    @Bean
    @ConditionalOnMissingBean
    public GlobalExceptionHandler manejadorGlobalDeErrores() {
        return new GlobalExceptionHandler();
    }
}
