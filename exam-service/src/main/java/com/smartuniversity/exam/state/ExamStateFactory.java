package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.ExamStateType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

/**
 * Factory returning the concrete ExamState implementation for a given state type.
 */
@Component
public class ExamStateFactory {

    private final Map<ExamStateType, ExamState> states = new EnumMap<>(ExamStateType.class);

    public ExamStateFactory() {
        states.put(ExamStateType.DRAFT, new DraftExamState());
        states.put(ExamStateType.SCHEDULED, new ScheduledExamState());
        states.put(ExamStateType.LIVE, new LiveExamState());
        states.put(ExamStateType.CLOSED, new ClosedExamState());
    }

    public ExamState getState(ExamStateType type) {
        ExamState state = states.get(type);
        if (state == null) {
            return new DraftExamState();
        }
        return state;
    }
}