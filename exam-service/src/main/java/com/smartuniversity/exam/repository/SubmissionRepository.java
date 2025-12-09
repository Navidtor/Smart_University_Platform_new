package com.smartuniversity.exam.repository;

import com.smartuniversity.exam.domain.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    Optional<Submission> findByExam_IdAndStudentIdAndTenantId(UUID examId, UUID studentId, String tenantId);

    List<Submission> findAllByExam_IdAndTenantId(UUID examId, String tenantId);
}