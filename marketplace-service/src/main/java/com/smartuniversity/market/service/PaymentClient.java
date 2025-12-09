package com.smartuniversity.market.service;

import com.smartuniversity.market.web.dto.PaymentAuthorizationRequest;
import com.smartuniversity.market.web.dto.PaymentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Objects;

/**
 * Simple HTTP client for interacting with the Payment service.
 */
@Component
public class PaymentClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public PaymentClient(@Value("${payment.service.base-url:http://localhost:8084}") String baseUrl) {
        this.restTemplate = new RestTemplate();
        this.baseUrl = baseUrl;
    }

    public PaymentResponse authorize(String tenantId, PaymentAuthorizationRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("X-Tenant-Id", tenantId);

        HttpEntity<PaymentAuthorizationRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<PaymentResponse> response = restTemplate.exchange(
                baseUrl + "/payment/payments/authorize",
                HttpMethod.POST,
                entity,
                PaymentResponse.class
        );
        return Objects.requireNonNull(response.getBody());
    }

    public PaymentResponse cancel(String tenantId, String orderId) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Tenant-Id", tenantId);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<PaymentResponse> response = restTemplate.exchange(
                baseUrl + "/payment/payments/cancel/" + orderId,
                HttpMethod.POST,
                entity,
                PaymentResponse.class
        );
        return Objects.requireNonNull(response.getBody());
    }
}