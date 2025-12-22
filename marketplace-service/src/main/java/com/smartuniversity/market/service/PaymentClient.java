package com.smartuniversity.market.service;

import com.smartuniversity.market.web.dto.PaymentAuthorizationRequest;
import com.smartuniversity.market.web.dto.PaymentResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Simple HTTP client for interacting with the Payment service.
 * 
 * IMPROVEMENTS:
 * 1. Added RestTemplate timeout configuration (connect: 5s, read: 10s)
 * 2. Added @CircuitBreaker for fault tolerance
 * 3. Added @Retry for transient failures
 * 4. Better null handling
 */
@Component
public class PaymentClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public PaymentClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${payment.service.base-url:http://localhost:8084}") String baseUrl) {
        // FIX: Configure timeouts to prevent hanging indefinitely
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(10))
                .build();
        this.baseUrl = baseUrl;
    }

    @CircuitBreaker(name = "paymentService", fallbackMethod = "authorizeFallback")
    @Retry(name = "paymentService")
    public PaymentResponse authorize(String tenantId, PaymentAuthorizationRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("X-Tenant-Id", tenantId);

        HttpEntity<PaymentAuthorizationRequest> entity = new HttpEntity<>(request, headers);
        
        try {
            ResponseEntity<PaymentResponse> response = restTemplate.exchange(
                    baseUrl + "/payment/payments/authorize",
                    HttpMethod.POST,
                    entity,
                    PaymentResponse.class
            );
            
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
    public PaymentResponse cancel(String tenantId, String orderId) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Tenant-Id", tenantId);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<PaymentResponse> response = restTemplate.exchange(
                    baseUrl + "/payment/payments/cancel/" + orderId,
                    HttpMethod.POST,
                    entity,
                    PaymentResponse.class
            );
            
            PaymentResponse body = response.getBody();
            if (body == null) {
                // Return a default response for cancel
                PaymentResponse defaultResponse = new PaymentResponse();
                defaultResponse.setStatus("CANCELED");
                return defaultResponse;
            }
            return body;
        } catch (RestClientException ex) {
            System.err.println("Failed to cancel payment for order " + orderId + ": " + ex.getMessage());
            PaymentResponse errorResponse = new PaymentResponse();
            errorResponse.setStatus("ERROR");
            errorResponse.setMessage("Failed to cancel: " + ex.getMessage());
            return errorResponse;
        }
    }

    private PaymentResponse authorizeFallback(String tenantId, PaymentAuthorizationRequest request, Exception ex) {
        System.err.println("Payment service unavailable (circuit breaker): " + ex.getMessage());
        PaymentResponse response = new PaymentResponse();
        response.setStatus("FAILED");
        response.setMessage("Payment service temporarily unavailable. Please try again later.");
        return response;
    }

    private PaymentResponse cancelFallback(String tenantId, String orderId, Exception ex) {
        System.err.println("Failed to cancel payment for order " + orderId + " (circuit breaker): " + ex.getMessage());
        PaymentResponse response = new PaymentResponse();
        response.setStatus("ERROR");
        response.setMessage("Could not cancel payment");
        return response;
    }

    public static class PaymentServiceException extends RuntimeException {
        public PaymentServiceException(String message) {
            super(message);
        }

        public PaymentServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
