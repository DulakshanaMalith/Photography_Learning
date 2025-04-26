package com.plp.controller;

import com.plp.model.User;
import com.plp.repository.UserRepository;
import com.plp.security.UserDetailsImpl;
import com.plp.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> registerRequest) {
        // Validate required fields
        if (registerRequest.get("name") == null || registerRequest.get("name").trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name is required"));
        }
        if (registerRequest.get("email") == null || registerRequest.get("email").trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        if (registerRequest.get("password") == null || registerRequest.get("password").trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }

        // Check if email is already taken
        if (userRepository.existsByEmail(registerRequest.get("email"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already taken!"));
        }

        try {
            // Create new user
            User user = new User();
            user.setName(registerRequest.get("name"));
            user.setEmail(registerRequest.get("email"));
            user.setPassword(passwordEncoder.encode(registerRequest.get("password")));
            // Roles are automatically set to "ROLE_USER" in the User constructor

            // Save user
            user = userRepository.save(user);

            // Authenticate the user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerRequest.get("email"), registerRequest.get("password"))
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtService.generateToken((UserDetailsImpl) authentication.getPrincipal());

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error during registration: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            // Validate required fields
            if (loginRequest.get("email") == null || loginRequest.get("email").trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            }
            if (loginRequest.get("password") == null || loginRequest.get("password").trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
            }

            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.get("email"), loginRequest.get("password"))
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtService.generateToken((UserDetailsImpl) authentication.getPrincipal());

            // Get user details
            User user = userRepository.findByEmail(loginRequest.get("email"))
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid email or password"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
            }

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + userDetails.getUsername()));

            // Create a response object with only the necessary user information
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("roles", user.getRoles());

            return ResponseEntity.ok(response);
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error retrieving user details: " + e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> tokenRequest) {
        // TODO: Implement Google login
        return ResponseEntity.ok(Map.of("message", "Google login not implemented yet"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid token format"));
            }

            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            
            if (userEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid token - no user email found"));
            }

            User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            
            // Validate the token with user details
            if (!jwtService.isTokenValid(token, userDetails)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired token"));
            }

            // Generate a new token with updated expiration
            String newToken = jwtService.generateToken(userDetails);

            Map<String, Object> response = new HashMap<>();
            response.put("token", newToken);
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Error refreshing token: " + e.getMessage()));
        }
    }
} 