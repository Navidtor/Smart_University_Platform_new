package com.smartuniversity.exam.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuniversity.common.events.ExamStartedEvent;
import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import com.smartuniversity.exam.domain.Question;
import com.smartuniversity.exam.domain.Submission;
import com.smartuniversity.exam.repository.ExamRepository;
import com.smartuniversity.exam.repository.SubmissionRepository;
import com.smartuniversity.exam.state.ExamState;
import com.smartuniversity.exam.state.ExamStateFactory;
import com.smartuniversity.exam.web.dto.CreateExamRequest;
import com.smartuniversity.exam.web.dto.CreateQuestionRequest;
import com.smartuniversity.exam.web.dto.ExamDetailDto;
import com.smartuniversity.exam.web.dto.ExamDto;
import com.smartuniversity.exam.web.dto.QuestionDto;
import com.smartuniversity.exam.web.dto.SubmitExamRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExamService {

    private static final Logger logger = LoggerFactory.getLogger(ExamService.class);

    private final ExamRepository examRepository;
    private final SubmissionRepository submissionRepository;
    private final ExamStateFactory examStateFactory;
    private final NotificationClient notificationClient;
    private final ObjectMapper objectMapper;
    
    // Optional: only available when RabbitMQ is configured
    private final RabbitTemplate rabbitTemplate;

    public ExamService(ExamRepository examRepository,
                       SubmissionRepository submissionRepository,
                       ExamStateFactory examStateFactory,
                       NotificationClient notificationClient,
                       ObjectMapper objectMapper,
                       @Autowired(required = false) RabbitTemplate rabbitTemplate) {
        this.examRepository = examRepository;
        this.submissionRepository = submissionRepository;
        this.examStateFactory = examStateFactory;
        this.notificationClient = notificationClient;
        this.objectMapper = objectMapper;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional(readOnly = true)
    public List<ExamDto> listExams(String tenantId) {
        return examRepository.findAllByTenantId(tenantId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExamDetailDto getExamDetail(UUID examId, String tenantId) {
        Exam exam = examRepository.findByIdAndTenantId(examId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        return toDetailDto(exam);
    }

    @Transactional
    public ExamDto createExam(CreateExamRequest request, UUID creatorId, String tenantId, String role) {
        if (!"TEACHER".equals(role) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teachers or admins may create exams");
        }
        if (CollectionUtils.isEmpty(request.getQuestions())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one question is required");
        }

        Exam exam = new Exam();
        exam.setTenantId(tenantId);
        exam.setCreatorId(creatorId);
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setStartTime(request.getStartTime() != null ? request.getStartTime() : Instant.now());
        exam.setState(ExamStateType.SCHEDULED);

        List<Question> questions = new ArrayList<>();
        int sortOrder = 1;
        for (CreateQuestionRequest qReq : request.getQuestions()) {
            Question question = new Question();
            question.setExam(exam);
            question.setText(qReq.getText());
            question.setSortOrder(sortOrder++);
            questions.add(question);
        }
        exam.setQuestions(questions);

        Exam saved = examRepository.save(exam);
        return toDto(saved);
    }

    @Transactional
    public ExamDto startExam(UUID examId, UUID userId, String tenantId, String role) {
        Exam exam = examRepository.findByIdAndTenantId(examId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        boolean isTeacherOrAdmin = "TEACHER".equals(role) || "ADMIN".equals(role);
        if (!isTeacherOrAdmin || !exam.getCreatorId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the exam creator may start the exam");
        }

        ExamState state = examStateFactory.getState(exam.getState());
        state.start(exam);
        Exam saved = examRepository.save(exam);

        // Notify Notification service with Circuit Breaker protection.
        notificationClient.notifyExamStarted(tenantId, saved.getId());

        // Publish exam.started event (only if RabbitMQ is available).
        if (rabbitTemplate != null) {
            ExamStartedEvent event = new ExamStartedEvent(
                    saved.getId(),
                    saved.getCreatorId(),
                    tenantId,
                    Instant.now()
            );
            rabbitTemplate.convertAndSend("university.events", "exam.exam.started", event);
        } else {
            logger.warn("RabbitTemplate not available - skipping exam.started event for exam {}", saved.getId());
        }

        return toDto(saved);
    }

    @Transactional
    public void submitExam(UUID examId, UUID studentId, String tenantId, SubmitExamRequest request) {
        Exam exam = examRepository.findByIdAndTenantId(examId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        ExamState state = examStateFactory.getState(exam.getState());
        if (!state.canSubmit()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Exam is not accepting submissions");
        }

        submissionRepository.findByExam_IdAndStudentIdAndTenantId(examId, studentId, tenantId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Submission already exists for this exam");
                });

        Submission submission = new Submission();
        submission.setExam(exam);
        submission.setTenantId(tenantId);
        submission.setStudentId(studentId);
        submission.setAnswersJson(toJson(request));
        submissionRepository.save(submission);
    }

    private String toJson(SubmitExamRequest request) {
        try {
            return objectMapper.writeValueAsString(request.getAnswers());
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid answers format");
        }
    }

    public ExamDto toDto(Exam exam) {
        return new ExamDto(
                exam.getId(),
                exam.getTitle(),
                exam.getDescription(),
                exam.getStartTime(),
                exam.getState()
        );
    }

    public ExamDetailDto toDetailDto(Exam exam) {
        List<QuestionDto> questionDtos = exam.getQuestions().stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(q -> new QuestionDto(q.getId(), q.getText(), q.getSortOrder()))
                .collect(Collectors.toList());

        return new ExamDetailDto(
                exam.getId(),
                exam.getTitle(),
                exam.getDescription(),
                exam.getStartTime(),
                exam.getState(),
                questionDtos
        );
    }
}