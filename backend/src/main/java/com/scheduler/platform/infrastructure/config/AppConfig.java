package com.scheduler.platform.infrastructure.config;

import com.scheduler.platform.scheduler.SchedulerProperties;
import com.scheduler.platform.security.jwt.JwtProperties;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableScheduling
@EnableAsync
@ConfigurationPropertiesScan(basePackages = "com.scheduler.platform")
public class AppConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
