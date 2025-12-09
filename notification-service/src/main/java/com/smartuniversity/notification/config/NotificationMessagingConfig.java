package com.smartuniversity.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for the Notification service.
 */
@Configuration
public class NotificationMessagingConfig {

    public static final String EXCHANGE_NAME = "university.events";
    public static final String ORDER_CONFIRMED_QUEUE = "notification.order-confirmed";
    public static final String EXAM_STARTED_QUEUE = "notification.exam-started";

    @Bean
    public TopicExchange universityExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue orderConfirmedQueue() {
        return new Queue(ORDER_CONFIRMED_QUEUE, true);
    }

    @Bean
    public Queue examStartedQueue() {
        return new Queue(EXAM_STARTED_QUEUE, true);
    }

    @Bean
    public Binding orderConfirmedBinding(Queue orderConfirmedQueue, TopicExchange universityExchange) {
        return BindingBuilder.bind(orderConfirmedQueue)
                .to(universityExchange)
                .with("market.order.confirmed");
    }

    @Bean
    public Binding examStartedBinding(Queue examStartedQueue, TopicExchange universityExchange) {
        return BindingBuilder.bind(examStartedQueue)
                .to(universityExchange)
                .with("exam.exam.started");
    }

    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter jacksonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jacksonMessageConverter);
        return template;
    }
}