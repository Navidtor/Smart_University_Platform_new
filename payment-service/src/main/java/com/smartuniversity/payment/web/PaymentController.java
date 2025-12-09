package com.smartuniversity.payment.web;

import com.smartuniversity.payment.domain.Payment;
import com.smartuniversity.payment.service.PaymentService;
import com.smartuniversity.payment.web.dto.PaymentAuthorizationRequest;
import com.smartuniversity.payment.web.dto.PaymentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST API for payment authorization and cancellation.
 */
@RestController
@RequestMapping("/payment/payments")
@Tag(name = "Payment", description = "Payment authorization and cancellation (Saga participant)")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/authorize")
    @Operation(summary = "Authorize payment", description = "Authorizes a payment for an order and persists payment state")
    public ResponseEntity<PaymentResponse> authorize(
            @Valid @RequestBody PaymentAuthorizationRequest request,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(tenantId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Payment payment = paymentService.authorize(tenantId, request);
        PaymentResponse response = toResponse(payment);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/cancel/{orderId}")
    @Operation(summary = "Cancel payment", description = "Applies compensation by cancelling a previously authorized payment for an order")
    public ResponseEntity<PaymentResponse> cancel(
            @PathVariable("orderId") UUID orderId,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(tenantId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Payment payment = paymentService.cancel(tenantId, orderId);
        PaymentResponse response = toResponse(payment);
        return ResponseEntity.ok(response);
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderId(),
                payment.getUserId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getProvider()
        );
    }
}