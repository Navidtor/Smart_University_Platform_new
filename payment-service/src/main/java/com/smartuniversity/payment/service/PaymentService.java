package com.smartuniversity.payment.service;

import com.smartuniversity.payment.domain.Payment;
import com.smartuniversity.payment.domain.PaymentStatus;
import com.smartuniversity.payment.repository.PaymentRepository;
import com.smartuniversity.payment.strategy.PaymentStrategy;
import com.smartuniversity.payment.web.dto.PaymentAuthorizationRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentStrategy paymentStrategy;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentStrategy paymentStrategy) {
        this.paymentRepository = paymentRepository;
        this.paymentStrategy = paymentStrategy;
    }

    @Transactional
    public Payment authorize(String tenantId, PaymentAuthorizationRequest request) {
        Payment payment = paymentStrategy.authorize(
                tenantId,
                request.getOrderId(),
                request.getUserId(),
                request.getAmount()
        );
        if (payment.getStatus() == PaymentStatus.FAILED) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Payment authorization failed");
        }
        return payment;
    }

    @Transactional
    public Payment cancel(String tenantId, UUID orderId) {
        Payment payment = paymentRepository.findByOrderIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        return paymentStrategy.cancel(payment);
    }
}