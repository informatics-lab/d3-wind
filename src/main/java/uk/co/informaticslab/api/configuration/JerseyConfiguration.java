package uk.co.informaticslab.api.configuration;

import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.context.annotation.Configuration;
import uk.co.informaticslab.api.filters.CorsResponseFilter;


/**
 * Configures and registers the endpoints & providers for jersey
 */
@Configuration
public class JerseyConfiguration extends ResourceConfig {

    public JerseyConfiguration() {

        register(CorsResponseFilter.class);

        //scans our controllers package and register them for us
        packages("uk.co.informaticslab.api.resources");

    }

}
