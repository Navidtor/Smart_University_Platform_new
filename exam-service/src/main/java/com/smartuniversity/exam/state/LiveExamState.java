package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * LIVE exam is already running; cannot be started again but accepts submissions.
 */
public class LiveExamState implements ExamState {

    @Override
    public ExamStateType getType() {
        return ExamStateType.LIVE;
    }

    @Override
    public void start(Exam exam) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Exam is already live");
    }

    @Override
    public boolean canSubmit() {
        return true;
    }
}