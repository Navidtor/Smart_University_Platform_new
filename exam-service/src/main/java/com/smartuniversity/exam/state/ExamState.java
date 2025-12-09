package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;

/**
 * State pattern interface for exam lifecycle behavior.
 */
public interface ExamState {

    ExamStateType getType();

    /**
     * Transition exam into LIVE state if allowed.
     */
    void start(Exam exam);

    /**
     * Whether students are allowed to submit in this state.
     */
    boolean canSubmit();
}