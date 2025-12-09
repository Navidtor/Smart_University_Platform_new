package com.smartuniversity.market.domain;

/**
 * Status of an order within the Marketplace Saga.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    CANCELED
}