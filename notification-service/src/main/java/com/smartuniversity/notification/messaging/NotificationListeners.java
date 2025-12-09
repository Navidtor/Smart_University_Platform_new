package com.smartuniversity.notification.messaging;

import com.smartuniversity.common.events.ExamStartedEvent;
import com.smartuniversity.common.events.OrderConfirmedEvent;
import com.smartuniversity.notification.config.NotificationMessagingConfig;
import com.smartuniversity.notification.service.NotificationService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ listeners implementing the Observer pattern for domain events.
 */
@Component
public class NotificationListeners {

    private final NotificationService notificationService;

    public NotificationListeners(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = NotificationMessagingConfig.ORDER_CONFIRMED_QUEUE)
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        notificationService.handleOrderConfirmed(event);
    }

    @RabbitListener(queues = NotificationMessagingConfig.EXAM_STARTED_QUEUE)
    public void onExamStarted(ExamStartedEvent event) {
        notificationService.handleExamStarted(event);
    }
}