package com.smartuniversity.payment.strategy;

import com.smartuniversity.payment.domain.Payment;
import com.smartuniversity.payment.domain.PaymentStatus;
import com.smartuniversity.payment.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Simple mock implementation that always authorizes payments unless the
 * configured failure threshold is exceeded.
 */
@Component
public class MockPaymentStrategy implements PaymentStrategy {

    private final PaymentRepository paymentRepository;
    private final double failureRate;

    public MockPaymentStrategy(PaymentRepository paymentRepository,
                               @Value("${payment.mock.failure-rate:0.0}") double failureRate) {
        this.paymentRepository = paymentRepository;
        this.failureRate = failureRate;
    }

    @Override
    public String getProviderName() {
        return "MOCK";
    }

    @Override
    public Payment authorize(String tenantId, UUID orderId, UUID userId, BigDecimal amount) {
        Payment payment = new Payment();
        payment.setTenantId(tenantId);
        payment.setOrderId(orderId);
        payment.setUserId(userId);
        payment.setAmount(amount);
        payment.setProvider(getProviderName());

        boolean shouldFail = failureRate > 0.0 && Math.random() < failureRate;
        payment.setStatus(shouldFail ? PaymentStatus.FAILED : PaymentStatus.AUTHORIZED);
        return paymentRepository.save(payment);
    }

    @Override
    public Payment cancel(Payment payment) {
        payment.setStatus(PaymentStatus.CANCELED);
        return paymentRepository.save(payment);
    }
}