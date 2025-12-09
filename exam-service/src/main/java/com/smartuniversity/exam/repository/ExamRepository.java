package com.smartuniversity.exam.repository;

import com.smartuniversity.exam.domain.Exam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    Optional<Exam> findByIdAndTenantId(UUID id, String tenantId);

    List<Exam> findAllByTenantId(String tenantId);
}