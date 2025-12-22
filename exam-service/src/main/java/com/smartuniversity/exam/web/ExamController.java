package com.smartuniversity.exam.web;

import com.smartuniversity.exam.service.ExamService;
import com.smartuniversity.exam.web.dto.CreateExamRequest;
import com.smartuniversity.exam.web.dto.ExamDetailDto;
import com.smartuniversity.exam.web.dto.ExamDto;
import com.smartuniversity.exam.web.dto.SubmitExamRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST API for exam creation, start, and submissions.
 */
@RestController
@RequestMapping("/exam")
@Tag(name = "Exams", description = "Exam management and submissions")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @GetMapping("/exams")
    @Operation(
            summary = "List exams",
            description = "Returns all exams for the current tenant. This endpoint is tenant-scoped and does not expose submissions."
    )
    public ResponseEntity<List<ExamDto>> listExams(@RequestHeader("X-Tenant-Id") String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ExamDto> exams = examService.listExams(tenantId);
        return ResponseEntity.ok(exams);
    }

    /**
     * FIX #2: EXAM SECURITY - Now requires role to validate that students
     * can only view exam details when the exam is LIVE.
     * Teachers/Admins can view anytime.
     */
    @GetMapping("/exams/{id}")
    @Operation(
            summary = "Get exam details",
            description = "Returns exam metadata and questions. Students can only view when exam is LIVE. Teachers/Admins can view anytime."
    )
    public ResponseEntity<ExamDetailDto> getExam(@PathVariable("id") UUID examId,
                                                 @RequestHeader("X-User-Id") String userIdHeader,
                                                 @RequestHeader("X-User-Role") String role,
                                                 @RequestHeader("X-Tenant-Id") String tenantId) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(userIdHeader) || !StringUtils.hasText(role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID userId = UUID.fromString(userIdHeader);
        ExamDetailDto exam = examService.getExamDetail(examId, userId, tenantId, role);
        return ResponseEntity.ok(exam);
    }

    @PostMapping("/exams")
    @Operation(
            summary = "Create exam",
            description = "Creates a new exam with questions. Only TEACHER/ADMIN are allowed to call this endpoint."
    )
    public ResponseEntity<ExamDto> createExam(@Valid @RequestBody CreateExamRequest request,
                                              @RequestHeader("X-User-Id") String userIdHeader,
                                              @RequestHeader("X-User-Role") String role,
                                              @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader) || !StringUtils.hasText(role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID creatorId = UUID.fromString(userIdHeader);
        ExamDto exam = examService.createExam(request, creatorId, tenantId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(exam);
    }

    @PostMapping("/exams/{id}/start")
    @Operation(
            summary = "Start exam",
            description = "Starts an exam by moving it to LIVE state, invoking Notification with a Circuit Breaker, and publishing an event. "
                    + "Only the exam creator with TEACHER/ADMIN role may start the exam."
    )
    public ResponseEntity<ExamDto> startExam(@PathVariable("id") UUID examId,
                                             @RequestHeader("X-User-Id") String userIdHeader,
                                             @RequestHeader("X-User-Role") String role,
                                             @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader) || !StringUtils.hasText(role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID userId = UUID.fromString(userIdHeader);
        ExamDto exam = examService.startExam(examId, userId, tenantId, role);
        return ResponseEntity.ok(exam);
    }

    /**
     * FIX #3: CLOSE EXAM ENDPOINT - Allows teachers/admins to close an exam.
     * Once closed, no more submissions are accepted.
     */
    @PostMapping("/exams/{id}/close")
    @Operation(
            summary = "Close exam",
            description = "Closes an exam by moving it to CLOSED state. No more submissions will be accepted. "
                    + "Only the exam creator with TEACHER/ADMIN role may close the exam."
    )
    public ResponseEntity<ExamDto> closeExam(@PathVariable("id") UUID examId,
                                             @RequestHeader("X-User-Id") String userIdHeader,
                                             @RequestHeader("X-User-Role") String role,
                                             @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader) || !StringUtils.hasText(role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID userId = UUID.fromString(userIdHeader);
        ExamDto exam = examService.closeExam(examId, userId, tenantId, role);
        return ResponseEntity.ok(exam);
    }

    @PostMapping("/exams/{id}/submit")
    @Operation(
            summary = "Submit exam answers",
            description = "Submits answers for an exam. Only STUDENT role is allowed. Exam must be in LIVE state and duplicates are rejected."
    )
    public ResponseEntity<Void> submitExam(@PathVariable("id") UUID examId,
                                           @Valid @RequestBody SubmitExamRequest request,
                                           @RequestHeader("X-User-Id") String userIdHeader,
                                           @RequestHeader("X-User-Role") String role,
                                           @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader) || !StringUtils.hasText(role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!"STUDENT".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        UUID studentId = UUID.fromString(userIdHeader);
        examService.submitExam(examId, studentId, tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}