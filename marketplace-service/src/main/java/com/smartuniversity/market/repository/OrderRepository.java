package com.smartuniversity.market.repository;

import com.smartuniversity.market.domain.Order;
import com.smartuniversity.market.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    /**
     * Find order by ID and tenant
     */
    Optional<Order> findByIdAndTenantId(UUID id, String tenantId);

    /**
     * Find all orders for a tenant
     */
    List<Order> findAllByTenantId(String tenantId);

    /**
     * NEW: Find user's orders ordered by creation date (newest first)
     */
    List<Order> findAllByTenantIdAndBuyerIdOrderByCreatedAtDesc(String tenantId, UUID buyerId);

    /**
     * Find orders by status
     */
    List<Order> findAllByTenantIdAndStatus(String tenantId, OrderStatus status);

    /**
     * Count orders for a user
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.tenantId = :tenantId AND o.buyerId = :buyerId")
    long countByTenantIdAndBuyerId(@Param("tenantId") String tenantId, @Param("buyerId") UUID buyerId);
}
