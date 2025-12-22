package com.smartuniversity.market.service;

import com.smartuniversity.market.web.dto.PaymentAuthorizationRequest;
import com.smartuniversity.market.web.dto.PaymentResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Client for communicating with the Payment Service.
 * 
 * FIXES APPLIED:
 * 1. Added RestTemplate timeout configuration (connect: 5s, read: 10s)
 * 2. Added @CircuitBreaker for fault tolerance
 * 3. Added @Retry for transient failures
 * 4. Proper null handling instead of Objects.requireNonNull throwing NPE
 */
@Component
public class PaymentClient {

    private final RestTemplate restTemplate;
    private final String paymentServiceUrl;

    public PaymentClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${services.payment.url:http://localhost:8086}") String paymentServiceUrl) {
        
        // FIX: Configure timeouts to prevent hanging indefinitely
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(10))
                .build();
        
        this.paymentServiceUrl = paymentServiceUrl;
    }

    @CircuitBreaker(name = "paymentService", fallbackMethod = "authorizeFallback")
    @Retry(name = "paymentService")
    public PaymentResponse authorize(String tenantId, PaymentAuthorizationRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Tenant-Id", tenantId);

        HttpEntity<PaymentAuthorizationRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<PaymentResponse> response = restTemplate.postForEntity(
                    paymentServiceUrl + "/payments/authorize",
                    entity,
                    PaymentResponse.class);

            // FIX: Proper null check instead of Objects.requireNonNull
            PaymentResponse body = response.getBody();
            if (body == null) {
                throw new PaymentServiceException("Payment service returned empty response");
            }
            
            return body;
        } catch (RestClientException ex) {
            throw new PaymentServiceException("Failed to communicate with payment service: " + ex.getMessage(), ex);
        }
    }

    @CircuitBreaker(name = "paymentService", fallbackMethod = "cancelFallback")
    public void cancel(String tenantId, String orderId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Tenant-Id", tenantId);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            restTemplate.postForEntity(
                    paymentServiceUrl + "/payments/cancel/" + orderId,
                    entity,
                    Void.class);
        } catch (RestClientException ex) {
            System.err.println("Failed to cancel payment for order " + orderId + ": " + ex.getMessage());
        }
    }

    private PaymentResponse authorizeFallback(String tenantId, PaymentAuthorizationRequest request, Exception ex) {
        System.err.println("Payment service unavailable: " + ex.getMessage());
        PaymentResponse response = new PaymentResponse();
        response.setStatus("FAILED");
        response.setMessage("Payment service temporarily unavailable");
        return response;
    }

    private void cancelFallback(String tenantId, String orderId, Exception ex) {
        System.err.println("Failed to cancel payment for order " + orderId + ": " + ex.getMessage());
    }

    public static class PaymentServiceException extends RuntimeException {
        public PaymentServiceException(String message) { super(message); }
        public PaymentServiceException(String message, Throwable cause) { super(message, cause); }
    }
}
