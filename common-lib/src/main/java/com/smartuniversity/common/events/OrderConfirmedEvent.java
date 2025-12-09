package com.smartuniversity.common.events;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when an order in the Marketplace service is confirmed.
 * Used for cross-service communication via RabbitMQ.
 */
public record OrderConfirmedEvent(
        UUID orderId,
        UUID buyerId,
        String tenantId,
        BigDecimal totalAmount,
        Instant confirmedAt
) implements Serializable {
}