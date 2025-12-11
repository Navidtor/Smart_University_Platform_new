package com.smartuniversity.exam;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Basic smoke test to verify Spring context loads correctly.
 * Uses MOCK web environment (same as integration tests) to ensure
 * RestTemplateBuilder and other web beans are available.
 */
@SpringBootTest
@AutoConfigureMockMvc
@EnableAutoConfiguration(exclude = {RabbitAutoConfiguration.class})
@ActiveProfiles("test")
class ExamServiceApplicationTests {

    @Test
    void contextLoads() {
        // verifies that the Spring context starts successfully
    }
}