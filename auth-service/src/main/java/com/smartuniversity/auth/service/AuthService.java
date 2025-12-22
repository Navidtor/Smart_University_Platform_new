package com.smartuniversity.auth.service;

import com.smartuniversity.auth.domain.Role;
import com.smartuniversity.auth.domain.User;
import com.smartuniversity.auth.repository.UserRepository;
import com.smartuniversity.auth.web.dto.AuthResponse;
import com.smartuniversity.auth.web.dto.LoginRequest;
import com.smartuniversity.auth.web.dto.RegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        boolean exists = userRepository.existsByUsernameAndTenantId(
                request.getUsername(), request.getTenantId());
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists in this tenant");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        // SECURITY FIX: Always assign STUDENT role on registration
        // Admin/Teacher roles must be granted by an administrator
        user.setRole(Role.STUDENT);
        user.setTenantId(request.getTenantId());

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        return new AuthResponse(token);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByUsernameAndTenantId(request.getUsername(), request.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }
}
