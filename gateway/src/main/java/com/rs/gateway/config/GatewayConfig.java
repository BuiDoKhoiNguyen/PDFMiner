package com.rs.gateway.config;

import com.rs.gateway.filter.JwtAuthenticationFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {
    private final JwtAuthenticationFilter filter;

    public GatewayConfig(JwtAuthenticationFilter filter) {
        this.filter = filter;
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth", r -> r.path("/api/auth/**")
                        .uri("lb://user-service"))
                .route("users", r -> r.path("/api/users/**", "/api/me/**")
                        .filters(f -> f.filter(filter))
                        .uri("lb://user-service"))
                .route("files", r -> r.path("/api/files/**")
                        .filters(f -> f.filter(filter))
                        .uri("lb://storage-service"))
                .route("documents", r -> r.path("/api/documents/**")
                        .filters(f -> f.filter(filter))
                        .uri("lb://document-service"))
                .build();
    }
}