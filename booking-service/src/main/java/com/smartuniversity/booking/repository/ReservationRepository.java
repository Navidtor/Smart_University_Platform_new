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
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

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
}