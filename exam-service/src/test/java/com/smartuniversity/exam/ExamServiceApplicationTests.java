package com.smartuniversity.exam;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@EnableAutoConfiguration(exclude = {RabbitAutoConfiguration.class})
@ActiveProfiles("test")
class ExamServiceApplicationTests {

    @Test
    void contextLoads() {
        // verifies that the Spring context starts successfully
    }
}