package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;

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
    public boolean canSubmit() {
        return false;
    }
}