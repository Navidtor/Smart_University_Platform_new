package com.smartuniversity.exam.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class SubmitExamRequest {

    /**
     * Answers keyed by question index or identifier.
     * For simplicity, clients can use "q1", "q2", etc.
     */
    @NotNull
    private Map<String, String> answers;

    public Map<String, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, String> answers) {
        this.answers = answers;
    }
}