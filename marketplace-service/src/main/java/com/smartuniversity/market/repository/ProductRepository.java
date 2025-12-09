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

    List<Product> findAllByTenantId(String tenantId);

    Optional<Product> findByIdAndTenantId(UUID id, String tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id and p.tenantId = :tenantId")
    Optional<Product> findByIdAndTenantIdForUpdate(@Param("id") UUID id, @Param("tenantId") String tenantId);
}