package com.smartuniversity.booking.service;

import com.smartuniversity.booking.domain.Reservation;
import com.smartuniversity.booking.domain.ReservationStatus;
import com.smartuniversity.booking.domain.Resource;
import com.smartuniversity.booking.repository.ReservationRepository;
import com.smartuniversity.booking.repository.ResourceRepository;
import com.smartuniversity.booking.web.dto.CreateReservationRequest;
import com.smartuniversity.booking.web.dto.ResourceDto;
import com.smartuniversity.booking.web.dto.CreateResourceRequest;
import com.smartuniversity.booking.web.dto.ReservationDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

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
                .map(resource -> new ResourceDto(
                        resource.getId(),
                        resource.getName(),
                        resource.getType(),
                        resource.getCapacity()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ResourceDto createResource(CreateResourceRequest request, String tenantId) {
        Resource resource = new Resource();
        resource.setTenantId(tenantId);
        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());

        Resource saved = resourceRepository.save(resource);
        return new ResourceDto(saved.getId(), saved.getName(), saved.getType(), saved.getCapacity());
    }

    @Transactional
    public ReservationDto createReservation(CreateReservationRequest request, UUID userId, String tenantId) {
        if (request.getEndTime().isBefore(request.getStartTime())
                || request.getEndTime().equals(request.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }

        Resource resource = resourceRepository.findByIdAndTenantIdForUpdate(request.getResourceId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        Instant start = request.getStartTime();
        Instant end = request.getEndTime();

        List<Reservation> overlapping = reservationRepository.findOverlappingReservationsForUpdate(
                resource.getId(),
                tenantId,
                ReservationStatus.CREATED,
                start,
                end);
        if (!overlapping.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource already reserved for requested period");
        }

        Reservation reservation = new Reservation();
        reservation.setResource(resource);
        reservation.setTenantId(tenantId);
        reservation.setUserId(userId);
        reservation.setStartTime(start);
        reservation.setEndTime(end);
        reservation.setStatus(ReservationStatus.CREATED);

        Reservation saved = reservationRepository.save(reservation);
        return new ReservationDto(
                saved.getId(),
                resource.getId(),
                saved.getUserId(),
                saved.getStartTime(),
                saved.getEndTime(),
                saved.getStatus());
    }
}