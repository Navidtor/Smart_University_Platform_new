package com.smartuniversity.exam.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuniversity.exam.domain.Exam;
import com.smartuniversity.exam.domain.ExamStateType;
import com.smartuniversity.exam.repository.ExamRepository;
import com.smartuniversity.exam.web.dto.CreateExamRequest;
import com.smartuniversity.exam.web.dto.CreateQuestionRequest;
import com.smartuniversity.exam.web.dto.SubmitExamRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@EnableAutoConfiguration(exclude = {RabbitAutoConfiguration.class})
@ActiveProfiles("test")
class ExamControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private final String tenantId = "engineering";
    private final String teacherId = UUID.randomUUID().toString();
    private final String studentId = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        examRepository.deleteAll();
    }

    @Test
    void createAndStartExamShouldWorkForTeacher() throws Exception {
        CreateExamRequest create = new CreateExamRequest();
        create.setTitle("Midterm");
        create.setDescription("CS101 Midterm");
        create.setStartTime(Instant.now());
        CreateQuestionRequest q = new CreateQuestionRequest();
        q.setText("What is Java?");
        create.setQuestions(List.of(q));

        String body = objectMapper.writeValueAsString(create);

        // Create exam
        String responseBody = mockMvc.perform(post("/exam/exams")
                        .header("X-Tenant-Id", tenantId)
                        .header("X-User-Id", teacherId)
                        .header("X-User-Role", "TEACHER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        var node = objectMapper.readTree(responseBody);
        String examId = node.get("id").asText();

        // Start exam
        mockMvc.perform(post("/exam/exams/{id}/start", examId)
                        .header("X-Tenant-Id", tenantId)
                        .header("X-User-Id", teacherId)
                        .header("X-User-Role", "TEACHER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value(ExamStateType.LIVE.name()));
    }

    @Test
    void studentCanSubmitLiveExam() throws Exception {
        // Create exam directly
        Exam exam = new Exam();
        exam.setTenantId(tenantId);
        exam.setCreatorId(UUID.fromString(teacherId));
        exam.setTitle("Quiz");
        exam.setDescription("Quick quiz");
        exam.setStartTime(Instant.now());
        exam.setState(ExamStateType.LIVE);
        exam = examRepository.save(exam);

        SubmitExamRequest submit = new SubmitExamRequest();
        submit.setAnswers(Map.of("q1", "42"));

        mockMvc.perform(post("/exam/exams/{id}/submit", exam.getId())
                        .header("X-Tenant-Id", tenantId)
                        .header("X-User-Id", studentId)
                        .header("X-User-Role", "STUDENT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submit)))
                .andExpect(status().isCreated());
    }

    @Test
    void listExamsReturnsExamsForTenant() throws Exception {
        Exam exam = new Exam();
        exam.setTenantId(tenantId);
        exam.setCreatorId(UUID.fromString(teacherId));
        exam.setTitle("ListTest");
        exam.setDescription("List test exam");
        exam.setStartTime(Instant.now());
        exam.setState(ExamStateType.SCHEDULED);
        examRepository.save(exam);

        mockMvc.perform(get("/exam/exams")
                        .header("X-Tenant-Id", tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", notNullValue()))
                .andExpect(jsonPath("$[0].title").value("ListTest"));
    }
}