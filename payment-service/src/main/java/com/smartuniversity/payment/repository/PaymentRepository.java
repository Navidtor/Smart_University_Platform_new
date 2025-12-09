package com.smartuniversity.payment.repository;

import com.smartuniversity.payment.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByOrderIdAndTenantId(UUID orderId, String tenantId);
}