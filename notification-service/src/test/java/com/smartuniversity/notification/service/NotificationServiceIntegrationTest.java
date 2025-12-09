package com.smartuniversity.notification.service;

import com.smartuniversity.common.events.OrderConfirmedEvent;
import com.smartuniversity.notification.repository.NotificationLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class NotificationServiceIntegrationTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationLogRepository logRepository;

    @Test
    void handleOrderConfirmedShouldPersistLog() {
        OrderConfirmedEvent event = new OrderConfirmedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "engineering",
                BigDecimal.valueOf(100.0),
                Instant.now()
        );

        notificationService.handleOrderConfirmed(event);

        assertThat(logRepository.findAll()).hasSize(1);
        assertThat(logRepository.findAll().get(0).getType()).isEqualTo("ORDER_CONFIRMED");
    }
}