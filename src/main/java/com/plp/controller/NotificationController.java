package com.plp.controller;

import com.plp.model.Notification;
import com.plp.model.User;
import com.plp.service.NotificationService;
import com.plp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    // Get all notifications for the authenticated user
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        String userId = user.getId();
        System.out.println("[DEBUG] Fetching notifications for userId: " + userId);
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    // Mark all as read
    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        String userId = user.getId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    // Delete all notifications
    @DeleteMapping
    public ResponseEntity<?> deleteAll(Authentication authentication) {
        String userId = authentication.getName();
        notificationService.deleteAll(userId);
        return ResponseEntity.ok().build();
    }

    // Delete a single notification
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id, Authentication authentication) {
        String userId = authentication.getName();
        notificationService.deleteById(id, userId);
        return ResponseEntity.ok().build();
    }

    // Create a notification (for testing/demo)
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Notification notification, Authentication authentication) {
        // Optionally, set the userId to the authenticated user:
        // notification.setUserId(authentication.getName());
        notification.setCreatedAt(new java.util.Date());
        notificationService.createNotification(notification);
        return ResponseEntity.ok().build();
    }
} 