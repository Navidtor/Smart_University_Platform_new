package com.smartuniversity.common.events;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when an exam is started.
 */
public record ExamStartedEvent(
        UUID examId,
        UUID creatorId,
        String tenantId,
        Instant startedAt
) implements Serializable {
}