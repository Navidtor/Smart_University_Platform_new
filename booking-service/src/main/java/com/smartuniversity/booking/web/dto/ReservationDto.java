package com.smartuniversity.booking.web.dto;

import com.smartuniversity.booking.domain.ReservationStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for Reservation responses.
 * 
 * FIX #8: Added resourceName for better UX in calendar view
 */
public class ReservationDto {

    private UUID id;
    private UUID resourceId;
    private String resourceName;  // FIX #8: Added for better UX
    private UUID userId;
    private Instant startTime;
    private Instant endTime;
    private ReservationStatus status;

    public ReservationDto() {
    }

    // Original constructor for backward compatibility
    public ReservationDto(UUID id, UUID resourceId, UUID userId, Instant startTime, Instant endTime, ReservationStatus status) {
        this.id = id;
        this.resourceId = resourceId;
        this.userId = userId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
    }

    // FIX #8: New constructor with resourceName
    public ReservationDto(UUID id, UUID resourceId, String resourceName, UUID userId, 
                          Instant startTime, Instant endTime, ReservationStatus status) {
        this.id = id;
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.userId = userId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public void setResourceId(UUID resourceId) {
        this.resourceId = resourceId;
    }

    // FIX #8: Getter and setter for resourceName
    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }
}
