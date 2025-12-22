package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;

/**
 * State pattern interface for exam lifecycle behavior.
 * 
 * State transitions:
 * - DRAFT/SCHEDULED → LIVE (via start())
 * - LIVE → CLOSED (via close())
 */
public interface ExamState {

    ExamStateType getType();

    /**
     * Transition exam into LIVE state if allowed.
     */
    void start(Exam exam);

    /**
     * FIX #3: Transition exam into CLOSED state if allowed.
     * Once closed, no more submissions are accepted.
     */
    void close(Exam exam);

    /**
     * Whether students are allowed to submit in this state.
     */
    boolean canSubmit();
}