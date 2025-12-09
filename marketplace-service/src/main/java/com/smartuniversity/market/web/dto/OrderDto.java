package com.smartuniversity.market.web.dto;

import com.smartuniversity.market.domain.OrderStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class OrderDto {

    private UUID id;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private List<OrderItemDto> items;

    public OrderDto() {
    }

    public OrderDto(UUID id, BigDecimal totalAmount, OrderStatus status, List<OrderItemDto> items) {
        this.id = id;
        this.totalAmount = totalAmount;
        this.status = status;
        this.items = items;
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
}