package com.smartuniversity.exam.config;

import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import com.smartuniversity.exam.domain.Question;
import com.smartuniversity.exam.repository.ExamRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Configuration
@Profile("demo")
public class DemoDataConfig {

    @Bean
    CommandLineRunner examDemoData(ExamRepository examRepository) {
        return args -> {
            if (examRepository.count() > 0) {
                return;
            }

            String tenantId = "engineering";
            UUID demoTeacherId = UUID.randomUUID();

            Exam exam = new Exam();
            exam.setTenantId(tenantId);
            exam.setCreatorId(demoTeacherId);
            exam.setTitle("Sample Demo Exam");
            exam.setDescription("Demo exam seeded for the engineering tenant");
            exam.setStartTime(Instant.now());
            exam.setState(ExamStateType.SCHEDULED);

            Question q1 = new Question();
            q1.setExam(exam);
            q1.setText("What is microservices architecture?");
            q1.setSortOrder(1);

            exam.setQuestions(List.of(q1));

            examRepository.save(exam);
        };
    }
}