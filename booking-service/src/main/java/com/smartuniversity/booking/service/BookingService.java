package com.smartuniversity.booking.service;

import com.smartuniversity.booking.domain.Reservation;
import com.smartuniversity.booking.domain.ReservationStatus;
import com.smartuniversity.booking.domain.Resource;
import com.smartuniversity.booking.repository.ReservationRepository;
import com.smartuniversity.booking.repository.ResourceRepository;
import com.smartuniversity.booking.web.dto.CreateReservationRequest;
import com.smartuniversity.booking.web.dto.CreateResourceRequest;
import com.smartuniversity.booking.web.dto.ReservationDto;
import com.smartuniversity.booking.web.dto.ResourceDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    // Maximum reservation duration: 24 hours
    private static final Duration MAX_DURATION = Duration.ofHours(24);
    // Minimum reservation duration: 30 minutes
    private static final Duration MIN_DURATION = Duration.ofMinutes(30);

    private final ResourceRepository resourceRepository;
    private final ReservationRepository reservationRepository;

    public BookingService(ResourceRepository resourceRepository,
                          ReservationRepository reservationRepository) {
        this.resourceRepository = resourceRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public List<ResourceDto> listResources(String tenantId) {
        return resourceRepository.findAllByTenantId(tenantId).stream()
                .map(this::toResourceDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResourceDto createResource(CreateResourceRequest request, String tenantId) {
        Resource resource = new Resource();
        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setTenantId(tenantId);

        Resource saved = resourceRepository.save(resource);
        return toResourceDto(saved);
    }

    @Transactional
    public ReservationDto createReservation(CreateReservationRequest request, UUID userId, String tenantId) {
        // Validate times
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start and end times are required");
        }

        // FIX: Validate end time is after start time
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }

        // FIX: Validate duration constraints
        Duration duration = Duration.between(request.getStartTime(), request.getEndTime());
        if (duration.compareTo(MIN_DURATION) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Reservation must be at least 30 minutes");
        }
        if (duration.compareTo(MAX_DURATION) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Reservation cannot exceed 24 hours");
        }

        // Validate start time is in the future
        if (request.getStartTime().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Start time must be in the future");
        }

        // Find resource
        Resource resource = resourceRepository.findByIdAndTenantId(request.getResourceId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        // FIX: Check for overlapping reservations with pessimistic locking
        List<Reservation> overlapping = reservationRepository.findOverlappingReservationsForUpdate(
                request.getResourceId(),
                tenantId,
                ReservationStatus.CREATED,
                request.getStartTime(),
                request.getEndTime());

        if (!overlapping.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "This time slot is already booked. Please choose another time.");
        }

        // Create reservation
        Reservation reservation = new Reservation();
        reservation.setResource(resource);
        reservation.setUserId(userId);
        reservation.setTenantId(tenantId);
        reservation.setStartTime(request.getStartTime());
        reservation.setEndTime(request.getEndTime());
        reservation.setStatus(ReservationStatus.CREATED);

        Reservation saved = reservationRepository.save(reservation);
        return toReservationDto(saved);
    }

    @Transactional
    public void cancelReservation(UUID reservationId, UUID userId, String tenantId) {
        Reservation reservation = reservationRepository.findByIdAndTenantId(reservationId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));

        // Only owner can cancel
        if (!reservation.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only cancel your own reservations");
        }

        // Can't cancel past reservations
        if (reservation.getEndTime().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot cancel past reservations");
        }

        reservation.setStatus(ReservationStatus.CANCELED);
        reservationRepository.save(reservation);
    }

    private ResourceDto toResourceDto(Resource resource) {
        return new ResourceDto(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity()
        );
    }

    private ReservationDto toReservationDto(Reservation reservation) {
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
