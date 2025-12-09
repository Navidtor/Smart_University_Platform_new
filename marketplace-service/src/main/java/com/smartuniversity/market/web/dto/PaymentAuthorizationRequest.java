package com.smartuniversity.market.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO mirroring the Payment service authorization request.
 * Kept in this service to decouple Payment's internal model.
 */
public class PaymentAuthorizationRequest {

    private UUID orderId;
    private UUID userId;
    private BigDecimal amount;

    public UUID getOrderId() {
        return orderId;
    }

    public void setOrderId(UUID orderId) {
        this.orderId = orderId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}