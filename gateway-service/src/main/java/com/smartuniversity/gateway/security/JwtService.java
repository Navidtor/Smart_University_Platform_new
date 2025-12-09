package com.smartuniversity.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;

/**
 * Service for validating JWT tokens at the API Gateway.
 */
@Component
public class JwtService {

    private final Key signingKey;

    public JwtService(@Value("${security.jwt.secret}") String secret) {
        byte[] keyBytes;
        try {
            // Try standard Base64 decoding first
            keyBytes = Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException e) {
            // Fall back to URL-safe Base64 or use the secret as-is
            try {
                keyBytes = Base64.getUrlDecoder().decode(secret);
            } catch (IllegalArgumentException e2) {
                // Use secret directly as bytes if it's not Base64 encoded
                keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            }
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public JwtUserDetails parseToken(String token) throws JwtException {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String userId = claims.getSubject();
        String role = claims.get("role", String.class);
        String tenant = claims.get("tenant", String.class);
        return new JwtUserDetails(userId, role, tenant);
    }
}