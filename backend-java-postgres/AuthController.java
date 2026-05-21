package com.taskhub.enterprise.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    // Representation of our PostgreSQL user model
    public static class User {
        public String id;
        public String username;
        public String name;
        public String password;
        public String role;
        public String email;
        public LocalDateTime createdAt;
    }

    public static class LoginRequest {
        public String username;
        public String password;
    }

    public static class RegisterRequest {
        public String username;
        public String name;
        public String password;
        public String email;
        public String role;
    }

    // Temporary memory storage mimicking PostgreSQL repo
    private List<User> mockUserDb = new ArrayList<>();

    public AuthController() {
        // Pre-seed default Admin on boot
        User admin = new User();
        admin.id = "u-admin";
        admin.username = "admin";
        admin.name = "Administrator Utama";
        admin.password = "admin123"; // Handled by secure PasswordEncoder in production
        admin.role = "Administrator";
        admin.email = "admin@taskhub.com";
        admin.createdAt = LocalDateTime.now();
        mockUserDb.add(admin);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req.username == null || req.password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username dan Password required"));
        }

        // Search user
        Optional<User> found = mockUserDb.stream()
                .filter(u -> u.username.equalsIgnoreCase(req.username))
                .findFirst();

        if (found.isEmpty() || !found.get().password.equals(req.password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Username atau Password yang Anda masukkan salah!"));
        }

        User user = found.get();
        Map<String, Object> response = new HashMap<>();
        response.put("token", "secured-jwt-spring-boot-token-for-" + user.id);
        
        // Remove password before returning
        Map<String, Object> safeUser = new HashMap<>();
        safeUser.put("id", user.id);
        safeUser.put("username", user.username);
        safeUser.put("name", user.name);
        safeUser.put("role", user.role);
        safeUser.put("email", user.email);
        safeUser.put("createdAt", user.createdAt);
        response.put("user", safeUser);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.username == null || req.name == null || req.password == null || req.email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Input formulir tidak lengkap"));
        }

        boolean exists = mockUserDb.stream().anyMatch(u -> u.username.equalsIgnoreCase(req.username));
        if (exists) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username sudah terdaftar!"));
        }

        User newUser = new User();
        newUser.id = "u-" + UUID.randomUUID().toString().substring(0, 7);
        newUser.username = req.username.toLowerCase();
        newUser.name = req.name;
        newUser.password = req.password; // In production: passwordEncoder.encode(req.password)
        newUser.role = req.role != null ? req.role : "Developer";
        newUser.email = req.email;
        newUser.createdAt = LocalDateTime.now();

        mockUserDb.add(newUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
    }
}
