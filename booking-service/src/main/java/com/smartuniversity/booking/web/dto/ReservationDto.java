package com.smartuniversity.booking.web.dto;

import com.smartuniversity.booking.domain.ReservationStatus;

import java.time.Instant;
import java.util.UUID;

public class ReservationDto {

    private UUID id;
    private UUID resourceId;
    private UUID userId;
    private Instant startTime;
    private Instant endTime;
    private ReservationStatus status;

    public ReservationDto() {
    }

    public ReservationDto(UUID id, UUID resourceId, UUID userId, Instant startTime, Instant endTime, ReservationStatus status) {
        this.id = id;
        this.resourceId = resourceId;
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