package com.smartuniversity.notification.web;

import com.smartuniversity.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HTTP endpoint used by the Exam service to request explicit exam notifications.
 */
@RestController
@RequestMapping("/notification")
@Tag(name = "Notifications", description = "Notification HTTP endpoints used by other services")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/notify/exam/{examId}")
    @Operation(summary = "Request exam notification", description = "Logs a notification request for the given exam. Used by the Exam service.")
    public ResponseEntity<Void> notifyExam(@PathVariable("examId") String examId,
                                           @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId) {

        if (!StringUtils.hasText(tenantId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        notificationService.logExamNotificationRequest(tenantId, examId);
        return ResponseEntity.accepted().build();
    }
}