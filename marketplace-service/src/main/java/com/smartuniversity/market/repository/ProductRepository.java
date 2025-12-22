package com.smartuniversity.market.repository;

import com.smartuniversity.market.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    /**
     * Find all products for a tenant
     */
    List<Product> findAllByTenantId(String tenantId);

    /**
     * Find a product by ID and tenant
     */
    Optional<Product> findByIdAndTenantId(UUID id, String tenantId);

    /**
     * FIX: Find product with pessimistic write lock to prevent race conditions
     * during stock updates. This ensures that concurrent checkouts don't
     * oversell inventory.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.tenantId = :tenantId")
    Optional<Product> findByIdAndTenantIdForUpdate(
            @Param("id") UUID id, 
            @Param("tenantId") String tenantId);

    /**
     * Check if a product exists with the given name in a tenant
     */
    boolean existsByNameAndTenantId(String name, String tenantId);

    /**
     * Find products with low stock (for admin alerts)
     */
    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND p.stock < :threshold")
    List<Product> findLowStockProducts(
            @Param("tenantId") String tenantId, 
            @Param("threshold") int threshold);

    /**
     * Find products in stock
     */
    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND p.stock > 0")
    List<Product> findInStockByTenantId(@Param("tenantId") String tenantId);
}
