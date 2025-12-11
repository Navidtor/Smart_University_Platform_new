package com.smartuniversity.exam.service;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Tests Circuit Breaker behavior for NotificationClient.
 * Uses MOCK web environment to ensure RestTemplateBuilder and other web beans are available.
 */
@SpringBootTest
@AutoConfigureMockMvc
@EnableAutoConfiguration(exclude = {RabbitAutoConfiguration.class})
@ActiveProfiles("test")
class NotificationClientCircuitBreakerTest {

    @Autowired
    private NotificationClient notificationClient;

    @MockBean
    private RestTemplate restTemplate;

    @Autowired(required = false)
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @Test
    void notifyExamStartedShouldFallbackOnFailure() {
        when(restTemplate.exchange(anyString(), any(), any(), eq(Void.class)))
                .thenThrow(new ResourceAccessException("Notification service unavailable"));

        assertDoesNotThrow(() ->
                notificationClient.notifyExamStarted("engineering", UUID.randomUUID()));
    }
}