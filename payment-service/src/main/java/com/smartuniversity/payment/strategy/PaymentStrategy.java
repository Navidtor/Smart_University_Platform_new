package com.smartuniversity.payment.strategy;

import com.smartuniversity.payment.domain.Payment;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Strategy interface for different payment providers.
 */
public interface PaymentStrategy {

    String getProviderName();

    /**
     * Authorizes a payment for an order.
     */
    Payment authorize(String tenantId, UUID orderId, UUID userId, BigDecimal amount);

    /**
     * Cancels an existing payment if supported by the provider.
     */
    Payment cancel(Payment payment);
}