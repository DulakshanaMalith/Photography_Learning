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
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import java.util.Collections;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "https://accounts.google.com", "http://localhost:8080"}, 
    allowCredentials = "true", 
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
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
        try {
            System.out.println("Received token request: " + tokenRequest);
            
            String idToken = tokenRequest.get("credential");
            if (idToken == null) {
                System.out.println("Token is missing from request");
                return ResponseEntity.badRequest().body(Map.of("message", "Token is required"));
            }

            System.out.println("Received token: " + idToken.substring(0, 20) + "...");

            try {
                // Create HTTP transport
                NetHttpTransport transport = new NetHttpTransport();
                JacksonFactory jsonFactory = new JacksonFactory();
                
                // Create verifier
                GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                    .setAudience(Collections.singletonList("352546676662-gbiq96v7jgk9uuiknjf9369jccchmcs6.apps.googleusercontent.com"))
                    .build();

                System.out.println("Verifying token...");
                GoogleIdToken googleIdToken = verifier.verify(idToken);
                
                if (googleIdToken == null) {
                    System.out.println("Token verification failed - token is null");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid ID token"));
                }

                Payload payload = googleIdToken.getPayload();
                
                // Verify the token hasn't expired
                long currentTimeSeconds = System.currentTimeMillis() / 1000;
                long expirationTimeSeconds = payload.getExpirationTimeSeconds();
                
                System.out.println("Token expiration check - Current time: " + currentTimeSeconds + 
                                 ", Expiration time: " + expirationTimeSeconds);
                
                if (expirationTimeSeconds < currentTimeSeconds) {
                    System.out.println("Token has expired");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Token has expired"));
                }

                String email = payload.getEmail();
                String name = (String) payload.get("name");
                String googleId = payload.getSubject();

                System.out.println("Verified token for email: " + email);
                System.out.println("User name: " + name);
                System.out.println("Google ID: " + googleId);

                // Check if user exists
                User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        System.out.println("Creating new user for email: " + email);
                        // Create new user if doesn't exist
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setName(name);
                        newUser.setGoogleId(googleId);
                        return userRepository.save(newUser);
                    });

                // Generate JWT token
                UserDetailsImpl userDetails = UserDetailsImpl.build(user);
                String jwt = jwtService.generateToken(userDetails);

                Map<String, Object> response = new HashMap<>();
                response.put("token", jwt);
                response.put("user", user);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                System.err.println("Error verifying token: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Error verifying token: " + e.getMessage()));
            }
        } catch (Exception e) {
            System.err.println("Error during Google login: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Error during Google login: " + e.getMessage()));
        }
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