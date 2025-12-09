package com.smartuniversity.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuniversity.common.events.ExamStartedEvent;
import com.smartuniversity.common.events.OrderConfirmedEvent;
import com.smartuniversity.notification.domain.NotificationLog;
import com.smartuniversity.notification.repository.NotificationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationLogRepository logRepository;
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationLogRepository logRepository, ObjectMapper objectMapper) {
        this.logRepository = logRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void logExamNotificationRequest(String tenantId, String examId) {
        NotificationLog log = new NotificationLog();
        log.setTenantId(tenantId);
        log.setType("EXAM_NOTIFY_REQUESTED");
        log.setPayload("{\"examId\":\"" + examId + "\"}");
        logRepository.save(log);
        logger.info("Logged HTTP exam notification request for exam {}", examId);
    }

    @Transactional
    public void handleOrderConfirmed(OrderConfirmedEvent event) {
        NotificationLog log = new NotificationLog();
        log.setTenantId(event.tenantId());
        log.setType("ORDER_CONFIRMED");
        log.setPayload(toJson(event));
        logRepository.save(log);
        logger.info("Received order.confirmed event for order {}", event.orderId());
    }

    @Transactional
    public void handleExamStarted(ExamStartedEvent event) {
        NotificationLog log = new NotificationLog();
        log.setTenantId(event.tenantId());
        log.setType("EXAM_STARTED");
        log.setPayload(toJson(event));
        logRepository.save(log);
        logger.info("Received exam.started event for exam {}", event.examId());
    }

    private String toJson(Object event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}