package com.smartuniversity.gateway.security;

/**
 * User details extracted from a validated JWT token.
 */
public class JwtUserDetails {

    private final String userId;
    private final String role;
    private final String tenantId;

    public JwtUserDetails(String userId, String role, String tenantId) {
        this.userId = userId;
        this.role = role;
        this.tenantId = tenantId;
    }

    public String getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    public String getTenantId() {
        return tenantId;
    }
}