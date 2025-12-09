package com.smartuniversity.auth.repository;

import com.smartuniversity.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByUsernameAndTenantId(String username, String tenantId);

    Optional<User> findByUsernameAndTenantId(String username, String tenantId);
}