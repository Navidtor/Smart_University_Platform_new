package com.smartuniversity.exam.state;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExamStateFactoryTests {

    private final ExamStateFactory factory = new ExamStateFactory();

    @Test
    void scheduledExamCanBeStartedAndBecomesLive() {
        Exam exam = new Exam();
        exam.setState(ExamStateType.SCHEDULED);

        ExamState state = factory.getState(exam.getState());
        state.start(exam);

        assertThat(exam.getState()).isEqualTo(ExamStateType.LIVE);
        assertThat(factory.getState(ExamStateType.LIVE).canSubmit()).isTrue();
    }

    @Test
    void draftExamCannotBeStarted() {
        Exam exam = new Exam();
        exam.setState(ExamStateType.DRAFT);

        ExamState state = factory.getState(exam.getState());

        assertThatThrownBy(() -> state.start(exam))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    @Test
    void liveExamCannotBeStartedAgainButAcceptsSubmissions() {
        Exam exam = new Exam();
        exam.setState(ExamStateType.LIVE);

        ExamState state = factory.getState(exam.getState());

        assertThat(state.canSubmit()).isTrue();

        assertThatThrownBy(() -> state.start(exam))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    @Test
    void closedExamCannotBeStartedOrAcceptSubmissions() {
        Exam exam = new Exam();
        exam.setState(ExamStateType.CLOSED);

        ExamState state = factory.getState(exam.getState());

        assertThat(state.canSubmit()).isFalse();

        assertThatThrownBy(() -> state.start(exam))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }
}