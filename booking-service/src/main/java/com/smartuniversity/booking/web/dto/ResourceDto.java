package com.smartuniversity.booking.web.dto;

import java.util.UUID;

public class ResourceDto {

    private UUID id;
    private String name;
    private String type;
    private Integer capacity;

    public ResourceDto() {
    }

    public ResourceDto(UUID id, String name, String type, Integer capacity) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.capacity = capacity;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
}