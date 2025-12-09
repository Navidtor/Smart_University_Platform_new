package com.smartuniversity.dashboard.repository;

import com.smartuniversity.dashboard.domain.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SensorRepository extends JpaRepository<SensorReading, UUID> {

    List<SensorReading> findAllByTenantId(String tenantId);
}