package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * LIVE exam is running; cannot be started again but accepts submissions.
 * Can be closed to stop accepting submissions.
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

    /**
     * FIX #3: Close the exam - transition from LIVE to CLOSED.
     * Only LIVE exams can be closed.
     */
    @Override
    public void close(Exam exam) {
        exam.setState(ExamStateType.CLOSED);
    }

    @Override
    public boolean canSubmit() {
        return true;
    }
}