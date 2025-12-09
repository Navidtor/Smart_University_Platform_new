package com.smartuniversity.exam.web.dto;

import java.util.UUID;

public class QuestionDto {

    private UUID id;
    private String text;
    private int sortOrder;

    public QuestionDto() {
    }

    public QuestionDto(UUID id, String text, int sortOrder) {
        this.id = id;
        this.text = text;
        this.sortOrder = sortOrder;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}