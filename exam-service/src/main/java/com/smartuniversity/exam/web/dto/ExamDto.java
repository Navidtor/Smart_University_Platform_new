package com.smartuniversity.exam.web.dto;

import com.smartuniversity.exam.domain.ExamStateType;

import java.time.Instant;
import java.util.UUID;

public class ExamDto {

    private UUID id;
    private String title;
    private String description;
    private Instant startTime;
    private ExamStateType state;

    public ExamDto() {
    }

    public ExamDto(UUID id, String title, String description, Instant startTime, ExamStateType state) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.state = state;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public ExamStateType getState() {
        return state;
    }

    public void setState(ExamStateType state) {
        this.state = state;
    }
}