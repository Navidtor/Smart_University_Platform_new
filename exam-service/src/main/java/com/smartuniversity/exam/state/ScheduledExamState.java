package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * SCHEDULED exam can be started and transitions to LIVE.
 */
public class ScheduledExamState implements ExamState {

    @Override
    public ExamStateType getType() {
        return ExamStateType.SCHEDULED;
    }

    @Override
    public void start(Exam exam) {
        exam.setState(ExamStateType.LIVE);
    }

    @Override
    public void close(Exam exam) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot close a scheduled exam. Start it first.");
    }

    @Override
    public boolean canSubmit() {
        return false;
    }
}