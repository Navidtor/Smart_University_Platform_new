package com.smartuniversity.exam.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

/**
 * HTTP client for calling the Notification service.
 * Wrapped in a Resilience4j Circuit Breaker to ensure exam starts
 * succeed even if notifications fail.
 */
@Component
public class NotificationClient {

    private static final Logger logger = LoggerFactory.getLogger(NotificationClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public NotificationClient(RestTemplate restTemplate,
                              @Value("${notification.service.base-url:http://localhost:8086}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    @CircuitBreaker(name = "notificationCb", fallbackMethod = "notifyExamFallback")
    public void notifyExamStarted(String tenantId, UUID examId) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Tenant-Id", tenantId);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Void> response = restTemplate.exchange(
                baseUrl + "/notification/notify/exam/" + examId,
                HttpMethod.POST,
                entity,
                Void.class
        );
        logger.info("Notification service responded with status {}", response.getStatusCode());
    }

    @SuppressWarnings("unused")
    private void notifyExamFallback(String tenantId, UUID examId, Throwable throwable) {
        logger.warn("Falling back after notification failure for exam {} (tenant {}): {}",
                examId, tenantId, throwable.toString());
    }
}