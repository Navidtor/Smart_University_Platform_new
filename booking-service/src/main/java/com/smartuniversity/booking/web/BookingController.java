package com.smartuniversity.booking.web;

import com.smartuniversity.booking.domain.Reservation;
import com.smartuniversity.booking.domain.ReservationStatus;
import com.smartuniversity.booking.repository.ReservationRepository;
import com.smartuniversity.booking.service.BookingService;
import com.smartuniversity.booking.web.dto.CreateReservationRequest;
import com.smartuniversity.booking.web.dto.CreateResourceRequest;
import com.smartuniversity.booking.web.dto.ReservationDto;
import com.smartuniversity.booking.web.dto.ResourceDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/booking")
public class BookingController {

    private final BookingService bookingService;
    private final ReservationRepository reservationRepository;

    public BookingController(BookingService bookingService, ReservationRepository reservationRepository) {
        this.bookingService = bookingService;
        this.reservationRepository = reservationRepository;
    }

    @GetMapping("/resources")
    public List<ResourceDto> listResources(@RequestHeader("X-Tenant-Id") String tenantId) {
        return bookingService.listResources(tenantId);
    }

    @PostMapping("/resources")
    public ResourceDto createResource(
            @Valid @RequestBody CreateResourceRequest request,
            @RequestHeader("X-Tenant-Id") String tenantId) {
        return bookingService.createResource(request, tenantId);
    }

    /**
     * NEW ENDPOINT: Get all reservations for the tenant (for calendar view)
     */
    @GetMapping("/reservations")
    public List<ReservationDto> listReservations(@RequestHeader("X-Tenant-Id") String tenantId) {
        return reservationRepository.findAllByTenantId(tenantId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * NEW ENDPOINT: Get user's reservations
     */
    @GetMapping("/reservations/mine")
    public List<ReservationDto> getMyReservations(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId) {
        return reservationRepository.findAllByTenantIdAndUserId(tenantId, UUID.fromString(userId)).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @PostMapping("/reservations")
    public ResponseEntity<ReservationDto> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId) {
        ReservationDto dto = bookingService.createReservation(request, UUID.fromString(userId), tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * NEW ENDPOINT: Cancel a reservation
     */
    @DeleteMapping("/reservations/{id}")
    public ResponseEntity<Void> cancelReservation(
            @PathVariable("id") UUID reservationId,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId) {
        bookingService.cancelReservation(reservationId, UUID.fromString(userId), tenantId);
        return ResponseEntity.noContent().build();
    }

    private ReservationDto toDto(Reservation reservation) {
        return new ReservationDto(
                reservation.getId(),
                reservation.getResource().getId(),
                reservation.getUserId(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getStatus()
        );
    }
}
