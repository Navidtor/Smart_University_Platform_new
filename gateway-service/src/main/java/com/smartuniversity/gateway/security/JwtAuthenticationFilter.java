package com.smartuniversity.gateway.security;

import io.jsonwebtoken.JwtException;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import reactor.core.publisher.Mono;

/**
 * Global filter that validates JWT tokens on all non-/auth routes and injects
 * user identity and role headers into downstream requests.
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Allow unauthenticated access to auth endpoints and actuator health
        if (path.startsWith("/auth/") || path.startsWith("/actuator/") || path.contains("/actuator/health")) {
            return chain.filter(exchange);
        }

        // Allow CORS preflight without authentication
        if (request.getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        JwtUserDetails userDetails;
        try {
            userDetails = jwtService.parseToken(token);
        } catch (JwtException ex) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        if (!isAuthorized(userDetails, path, request.getMethod())) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", userDetails.getUserId())
                .header("X-User-Role", userDetails.getRole())
                .header("X-Tenant-Id", userDetails.getTenantId())
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private boolean isAuthorized(JwtUserDetails user, String path, HttpMethod method) {
        String role = user.getRole();
        if (role == null) {
            return false;
        }

        // Basic RBAC checks for sensitive routes.
        boolean isTeacherOrAdmin = role.equals("TEACHER") || role.equals("ADMIN");

        if (path.startsWith("/market/products") && HttpMethod.POST.equals(method)) {
            return isTeacherOrAdmin;
        }

        if (path.startsWith("/booking/resources") && HttpMethod.POST.equals(method)) {
            return isTeacherOrAdmin;
        }

        if (path.startsWith("/exam/exams") && HttpMethod.POST.equals(method)) {
            // Exam creation and start should be limited to teachers/admins.
            return isTeacherOrAdmin;
        }

        // By default any authenticated user is allowed.
        return true;
    }

    @Override
    public int getOrder() {
        // Ensure this filter runs early in the chain.
        return Ordered.HIGHEST_PRECEDENCE;
    }
}