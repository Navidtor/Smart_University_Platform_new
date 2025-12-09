package com.smartuniversity.gateway;

import com.smartuniversity.gateway.security.JwtAuthenticationFilter;
import com.smartuniversity.gateway.security.JwtService;
import com.smartuniversity.gateway.security.JwtUserDetails;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationFilterTests {

    @Test
    void missingAuthorizationHeaderShouldReturn401() {
        JwtService jwtService = Mockito.mock(JwtService.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService);

        MockServerHttpRequest request = MockServerHttpRequest.get("/booking/resources").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = ex -> {
            throw new AssertionError("Filter chain should not be invoked when authentication fails");
        };

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void studentCannotCreateMarketplaceProduct() {
        JwtService jwtService = Mockito.mock(JwtService.class);
        JwtUserDetails userDetails = new JwtUserDetails("user-1", "STUDENT", "engineering");
        Mockito.when(jwtService.parseToken("token")).thenReturn(userDetails);

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService);

        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/market/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = ex -> {
            throw new AssertionError("Filter chain should not be invoked when RBAC denies access");
        };

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void teacherCanCreateMarketplaceProductAndHeadersAreInjected() {
        JwtService jwtService = Mockito.mock(JwtService.class);
        JwtUserDetails userDetails = new JwtUserDetails("user-1", "TEACHER", "engineering");
        Mockito.when(jwtService.parseToken("token")).thenReturn(userDetails);

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService);

        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/market/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        class CapturingChain implements GatewayFilterChain {
            ServerWebExchange captured;

            @Override
            public Mono<Void> filter(ServerWebExchange ex) {
                this.captured = ex;
                return Mono.empty();
            }
        }

        CapturingChain chain = new CapturingChain();

        filter.filter(exchange, chain).block();

        assertThat(chain.captured).as("Filter should invoke downstream chain").isNotNull();
        HttpHeaders headers = chain.captured.getRequest().getHeaders();
        assertThat(headers.getFirst("X-User-Id")).isEqualTo("user-1");
        assertThat(headers.getFirst("X-User-Role")).isEqualTo("TEACHER");
        assertThat(headers.getFirst("X-Tenant-Id")).isEqualTo("engineering");
    }
}