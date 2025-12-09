package com.smartuniversity.booking.repository;

import com.smartuniversity.booking.domain.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    List<Resource> findAllByTenantId(String tenantId);

    Optional<Resource> findByIdAndTenantId(UUID id, String tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select r from Resource r
            where r.id = :id
              and r.tenantId = :tenantId
            """)
    Optional<Resource> findByIdAndTenantIdForUpdate(
            @Param("id") UUID id,
            @Param("tenantId") String tenantId);
}