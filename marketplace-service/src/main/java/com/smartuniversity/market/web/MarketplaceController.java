package com.smartuniversity.market.web;

import com.smartuniversity.market.domain.Product;
import com.smartuniversity.market.repository.ProductRepository;
import com.smartuniversity.market.service.OrderSagaService;
import com.smartuniversity.market.web.dto.CheckoutRequest;
import com.smartuniversity.market.web.dto.CreateProductRequest;
import com.smartuniversity.market.web.dto.OrderDto;
import com.smartuniversity.market.web.dto.ProductDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/market")
public class MarketplaceController {

    private final ProductRepository productRepository;
    private final OrderSagaService orderSagaService;

    public MarketplaceController(ProductRepository productRepository,
                                  OrderSagaService orderSagaService) {
        this.productRepository = productRepository;
        this.orderSagaService = orderSagaService;
    }

    // ===================== PRODUCTS =====================

    @GetMapping("/products")
    public List<ProductDto> listProducts(@RequestHeader("X-Tenant-Id") String tenantId) {
        return productRepository.findAllByTenantId(tenantId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/products/{id}")
    public ProductDto getProduct(
            @PathVariable UUID id,
            @RequestHeader("X-Tenant-Id") String tenantId) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return toDto(product);
    }

    @PostMapping("/products")
    public ResponseEntity<ProductDto> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Role") String role) {
        
        // Only TEACHER and ADMIN can create products
        if (!"TEACHER".equals(role) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Only teachers and admins can create products");
        }

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setTenantId(tenantId);

        Product saved = productRepository.save(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    // ===================== ORDERS =====================

    @PostMapping("/orders/checkout")
    public ResponseEntity<OrderDto> checkout(
            @Valid @RequestBody CheckoutRequest request,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId) {
        
        OrderDto order = orderSagaService.checkout(tenantId, UUID.fromString(userId), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    /**
     * NEW: Get user's order history
     */
    @GetMapping("/orders/mine")
    public List<OrderDto> getMyOrders(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId) {
        return orderSagaService.getUserOrders(tenantId, UUID.fromString(userId));
    }

    /**
     * NEW: Get a specific order
     */
    @GetMapping("/orders/{id}")
    public OrderDto getOrder(
            @PathVariable UUID id,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId) {
        return orderSagaService.getOrder(tenantId, id, UUID.fromString(userId));
    }

    private ProductDto toDto(Product product) {
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock()
        );
    }
}
