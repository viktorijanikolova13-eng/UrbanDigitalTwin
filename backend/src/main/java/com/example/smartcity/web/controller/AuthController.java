package com.example.smartcity.web.controller;

import com.example.smartcity.model.domain.User;
import com.example.smartcity.service.auth.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String token = authService.register(
                body.get("username"),
                body.get("email"),
                body.get("password"),
                body.get("fullName")
        );
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String token = authService.login(
                body.get("username"),
                body.get("password")
        );
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PutMapping("/update")
    public ResponseEntity<?> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body
    ) {

        User updatedUser = authService.updateUser(
                userDetails.getUsername(),
                body.get("username"),
                body.get("email")
        );

        return ResponseEntity.ok(Map.of(
                "username", updatedUser.getUsername(),
                "email", updatedUser.getEmail()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getUser(userDetails.getUsername());
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "role", user.getRole()
        ));
    }
}