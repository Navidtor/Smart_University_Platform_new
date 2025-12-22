package com.smartuniversity.market.web;

import com.smartuniversity.market.domain.Product;
import com.smartuniversity.market.repository.ProductRepository;
import com.smartuniversity.market.service.OrderSagaService;
import com.smartuniversity.market.web.dto.CheckoutRequest;
import com.smartuniversity.market.web.dto.OrderDto;
import com.smartuniversity.market.web.dto.ProductDto;
import com.smartuniversity.market.web.dto.ProductRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST API for Marketplace products and orders.
 * 
 * IMPROVEMENTS:
 * - Added GET /orders/mine endpoint for order history
 * - Added GET /orders/{id} endpoint for specific order
 */
@RestController
@RequestMapping("/market")
@Tag(name = "Marketplace", description = "Products catalog and Saga-based checkout")
public class MarketplaceController {

    private final ProductRepository productRepository;
    private final OrderSagaService orderSagaService;

    public MarketplaceController(ProductRepository productRepository,
            OrderSagaService orderSagaService) {
        this.productRepository = productRepository;
        this.orderSagaService = orderSagaService;
    }

    @GetMapping("/products")
    @Cacheable(cacheNames = "productsByTenant", key = "#root.args[0]")
    @Operation(summary = "List products", description = "Returns all products for the current tenant")
    public List<ProductDto> listProducts(@RequestHeader("X-Tenant-Id") String tenantId) {
        return productRepository.findAllByTenantId(tenantId).stream()
                .map(p -> new ProductDto(p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getStock()))
                .collect(Collectors.toList());
    }

    @PostMapping("/products")
    @CacheEvict(cacheNames = "productsByTenant", key = "#root.args[3]")
    @Operation(summary = "Create product", description = "Creates a new product (TEACHER/ADMIN only, enforced at gateway)")
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductRequest request,
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader) || !StringUtils.hasText(role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean isTeacherOrAdmin = "TEACHER".equals(role) || "ADMIN".equals(role);
        if (!isTeacherOrAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        UUID sellerId = UUID.fromString(userIdHeader);

        Product product = new Product();
        product.setTenantId(tenantId);
        product.setSellerId(sellerId);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());

        Product saved = productRepository.save(product);
        ProductDto dto = new ProductDto(saved.getId(), saved.getName(), saved.getDescription(), saved.getPrice(),
                saved.getStock());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PostMapping("/orders/checkout")
    @Operation(summary = "Checkout order", description = "Orchestrates the Saga across payment and stock updates for the given items")
    public ResponseEntity<OrderDto> checkout(@Valid @RequestBody CheckoutRequest request,
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID buyerId = UUID.fromString(userIdHeader);
        OrderDto order = orderSagaService.checkout(tenantId, buyerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    /**
     * NEW: Get user's order history
     */
    @GetMapping("/orders/mine")
    @Operation(summary = "Get my orders", description = "Returns all orders for the current user")
    public List<OrderDto> getMyOrders(
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        if (!StringUtils.hasText(userIdHeader)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID required");
        }
        
        UUID buyerId = UUID.fromString(userIdHeader);
        return orderSagaService.getUserOrders(tenantId, buyerId);
    }

    /**
     * NEW: Get a specific order
     */
    @GetMapping("/orders/{id}")
    @Operation(summary = "Get order", description = "Returns a specific order by ID")
    public OrderDto getOrder(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        if (!StringUtils.hasText(userIdHeader)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID required");
        }
        
        UUID buyerId = UUID.fromString(userIdHeader);
        return orderSagaService.getOrder(tenantId, id, buyerId);
    }
}
