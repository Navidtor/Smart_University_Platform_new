package com.smartuniversity.dashboard.repository;

import com.smartuniversity.dashboard.domain.ShuttleLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShuttleRepository extends JpaRepository<ShuttleLocation, UUID> {

    List<ShuttleLocation> findAllByTenantId(String tenantId);
}