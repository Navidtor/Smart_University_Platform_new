package com.smartuniversity.dashboard.web.dto;

import com.smartuniversity.dashboard.domain.SensorType;

import java.time.Instant;
import java.util.UUID;

public class SensorDto {

    private UUID id;
    private SensorType type;
    private String label;
    private double value;
    private String unit;
    private Instant updatedAt;

    public SensorDto() {
    }

    public SensorDto(UUID id, SensorType type, String label, double value, String unit, Instant updatedAt) {
        this.id = id;
        this.type = type;
        this.label = label;
        this.value = value;
        this.unit = unit;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public SensorType getType() {
        return type;
    }

    public void setType(SensorType type) {
        this.type = type;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public double getValue() {
        return value;
    }

    public void setValue(double value) {
        this.value = value;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}