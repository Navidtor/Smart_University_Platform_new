package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * DRAFT exams cannot be started, closed, or submitted.
 */
public class DraftExamState implements ExamState {

    @Override
    public ExamStateType getType() {
        return ExamStateType.DRAFT;
    }

    @Override
    public void start(Exam exam) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Draft exams cannot be started");
    }

    @Override
    public void close(Exam exam) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Draft exams cannot be closed");
    }

    @Override
    public boolean canSubmit() {
        return false;
    }
}