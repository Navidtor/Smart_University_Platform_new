package com.smartuniversity.market.service;

import com.smartuniversity.common.events.OrderConfirmedEvent;
import com.smartuniversity.market.domain.Order;
import com.smartuniversity.market.domain.OrderItem;
import com.smartuniversity.market.domain.OrderStatus;
import com.smartuniversity.market.domain.Product;
import com.smartuniversity.market.repository.OrderRepository;
import com.smartuniversity.market.repository.ProductRepository;
import com.smartuniversity.market.web.dto.CheckoutRequest;
import com.smartuniversity.market.web.dto.OrderDto;
import com.smartuniversity.market.web.dto.OrderItemDto;
import com.smartuniversity.market.web.dto.OrderItemRequest;
import com.smartuniversity.market.web.dto.PaymentAuthorizationRequest;
import com.smartuniversity.market.web.dto.PaymentResponse;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates the multi-step Saga for Marketplace checkout.
 * 
 * FIXES APPLIED:
 * 1. Added @Transactional to checkout() method
 * 2. Using pessimistic locking (findByIdAndTenantIdForUpdate) to prevent race conditions
 * 3. Added order history endpoints
 */
@Service
public class OrderSagaService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentClient paymentClient;
    private final RabbitTemplate rabbitTemplate;

    public OrderSagaService(ProductRepository productRepository,
            OrderRepository orderRepository,
            PaymentClient paymentClient,
            RabbitTemplate rabbitTemplate) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.paymentClient = paymentClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * FIX: Added @Transactional to ensure the entire checkout is atomic
     */
    @Transactional
    public OrderDto checkout(String tenantId, UUID buyerId, CheckoutRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one item is required");
        }

        // Step 1: create pending order and items
        Order order = createPendingOrder(tenantId, buyerId, request);

        // Step 2: request payment authorization
        PaymentAuthorizationRequest paymentRequest = new PaymentAuthorizationRequest();
        paymentRequest.setOrderId(order.getId());
        paymentRequest.setUserId(buyerId);
        paymentRequest.setAmount(order.getTotalAmount());

        PaymentResponse paymentResponse;
        try {
            paymentResponse = paymentClient.authorize(tenantId, paymentRequest);
        } catch (Exception ex) {
            // Mark order as canceled due to payment failure
            markOrderCanceled(tenantId, order.getId());
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Payment authorization failed");
        }

        if (!"AUTHORIZED".equalsIgnoreCase(paymentResponse.getStatus())) {
            markOrderCanceled(tenantId, order.getId());
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Payment not authorized");
        }

        // Step 3: decrement stock within transaction, compensate payment on failure
        try {
            confirmOrderAndDecrementStock(tenantId, order.getId());
        } catch (RuntimeException ex) {
            paymentClient.cancel(tenantId, order.getId().toString());
            markOrderCanceled(tenantId, order.getId());
            throw ex;
        }

        Order confirmed = orderRepository.findByIdAndTenantId(order.getId(), tenantId)
                .orElseThrow(() -> new IllegalStateException("Order disappeared during Saga"));

        // Step 4: publish order.confirmed event
        OrderConfirmedEvent event = new OrderConfirmedEvent(
                confirmed.getId(),
                confirmed.getBuyerId(),
                tenantId,
                confirmed.getTotalAmount(),
                Instant.now());
        rabbitTemplate.convertAndSend("university.events", "market.order.confirmed", event);

        return toDto(confirmed);
    }

    @Transactional
    protected Order createPendingOrder(String tenantId, UUID buyerId, CheckoutRequest request) {
        Map<UUID, Integer> quantities = new HashMap<>();
        for (OrderItemRequest item : request.getItems()) {
            if (item.getQuantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be positive");
            }
            quantities.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }

        List<Product> products = productRepository.findAllById(quantities.keySet());
        if (products.size() != quantities.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more products not found");
        }

        BigDecimal total = BigDecimal.ZERO;
        Order order = new Order();
        order.setTenantId(tenantId);
        order.setBuyerId(buyerId);
        order.setStatus(OrderStatus.PENDING);

        List<OrderItem> items = new ArrayList<>();
        for (Product product : products) {
            if (!tenantId.equals(product.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cross-tenant product access is not allowed");
            }
            int quantity = quantities.get(product.getId());
            
            // Check stock availability before creating order
            if (product.getStock() < quantity) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Insufficient stock for product: " + product.getName() + 
                        " (requested: " + quantity + ", available: " + product.getStock() + ")");
            }
            
            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
            total = total.add(itemTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPrice(product.getPrice());
            items.add(orderItem);
        }

        order.setTotalAmount(total);
        order.setItems(items);

        return orderRepository.save(order);
    }

    @Transactional
    protected void confirmOrderAndDecrementStock(String tenantId, UUID orderId) {
        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order is not pending");
        }

        // FIX: Use pessimistic locking to prevent race conditions
        for (OrderItem item : order.getItems()) {
            UUID productId = item.getProduct().getId();
            
            // FIX: Use findByIdAndTenantIdForUpdate for pessimistic locking
            Product product = productRepository.findByIdAndTenantIdForUpdate(productId, tenantId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

            if (product.getStock() < item.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Insufficient stock for product " + product.getName());
            }

            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
    }

    @Transactional
    protected void markOrderCanceled(String tenantId, UUID orderId) {
        orderRepository.findByIdAndTenantId(orderId, tenantId).ifPresent(order -> {
            order.setStatus(OrderStatus.CANCELED);
            orderRepository.save(order);
        });
    }

    /**
     * NEW: Get user's order history
     */
    @Transactional(readOnly = true)
    public List<OrderDto> getUserOrders(String tenantId, UUID buyerId) {
        return orderRepository.findAllByTenantIdAndBuyerIdOrderByCreatedAtDesc(tenantId, buyerId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * NEW: Get a specific order
     */
    @Transactional(readOnly = true)
    public OrderDto getOrder(String tenantId, UUID orderId, UUID buyerId) {
        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        
        // Ensure user can only see their own orders
        if (!order.getBuyerId().equals(buyerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        return toDto(order);
    }

    public OrderDto toDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems().stream()
                .map(i -> new OrderItemDto(
                        i.getProduct().getId(),
                        i.getProduct().getName(),
                        i.getQuantity(),
                        i.getPrice()))
                .collect(Collectors.toList());

        return new OrderDto(order.getId(), order.getTotalAmount(), order.getStatus(), itemDtos);
    }
}
