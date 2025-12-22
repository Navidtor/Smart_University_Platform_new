package com.smartuniversity.booking.repository;

import com.smartuniversity.booking.domain.Reservation;
import com.smartuniversity.booking.domain.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    /**
     * Find all reservations for a tenant (for calendar view)
     */
    List<Reservation> findAllByTenantId(String tenantId);

    /**
     * Find all reservations for a specific user in a tenant
     */
    List<Reservation> findAllByTenantIdAndUserId(String tenantId, UUID userId);

    /**
     * Find a specific reservation by ID and tenant
     */
    Optional<Reservation> findByIdAndTenantId(UUID id, String tenantId);

    /**
     * Find overlapping reservations with pessimistic locking to prevent double-booking
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select r from Reservation r
            where r.resource.id = :resourceId
              and r.tenantId = :tenantId
              and r.status = :status
              and r.endTime > :startTime
              and r.startTime < :endTime
            """)
    List<Reservation> findOverlappingReservationsForUpdate(
            @Param("resourceId") UUID resourceId,
            @Param("tenantId") String tenantId,
            @Param("status") ReservationStatus status,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime);

    /**
     * Find upcoming reservations for a user
     */
    @Query("""
            select r from Reservation r
            where r.tenantId = :tenantId
              and r.userId = :userId
              and r.status = :status
              and r.endTime > :now
            order by r.startTime asc
            """)
    List<Reservation> findUpcomingByUserIdAndTenantId(
            @Param("tenantId") String tenantId,
            @Param("userId") UUID userId,
            @Param("status") ReservationStatus status,
            @Param("now") Instant now);
}
