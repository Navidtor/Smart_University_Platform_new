package com.smartuniversity.market.web.dto;

import com.smartuniversity.market.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Order responses.
 * 
 * FIX #3: Added createdAt field for order history display
 */
public class OrderDto {

    private UUID id;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private List<OrderItemDto> items;
    private Instant createdAt;  // FIX #3: Added for order history

    public OrderDto() {
    }

    public OrderDto(UUID id, BigDecimal totalAmount, OrderStatus status, List<OrderItemDto> items) {
        this.id = id;
        this.totalAmount = totalAmount;
        this.status = status;
        this.items = items;
    }

    // FIX #3: New constructor with createdAt
    public OrderDto(UUID id, BigDecimal totalAmount, OrderStatus status, List<OrderItemDto> items, Instant createdAt) {
        this.id = id;
        this.totalAmount = totalAmount;
        this.status = status;
        this.items = items;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }

    // FIX #3: Getter and setter for createdAt
    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
