package com.smartuniversity.dashboard.web.dto;

import java.time.Instant;
import java.util.UUID;

public class ShuttleDto {

    private UUID id;
    private String name;
    private double latitude;
    private double longitude;
    private Instant updatedAt;

    public ShuttleDto() {
    }

    public ShuttleDto(UUID id, String name, double latitude, double longitude, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}