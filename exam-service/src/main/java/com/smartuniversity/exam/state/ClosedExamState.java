package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * CLOSED exam cannot be started, closed again, or submitted to.
 */
public class ClosedExamState implements ExamState {

    @Override
    public ExamStateType getType() {
        return ExamStateType.CLOSED;
    }

    @Override
    public void start(Exam exam) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Exam is already closed");
    }

    @Override
    public void close(Exam exam) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Exam is already closed");
    }

    @Override
    public boolean canSubmit() {
        return false;
    }
}