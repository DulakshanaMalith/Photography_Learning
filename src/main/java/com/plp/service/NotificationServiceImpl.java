package com.plp.service;

import com.plp.model.Notification;
import com.plp.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public void markAllAsRead(String userId) {
        System.out.println("[DEBUG] User ID for markAllAsRead: " + userId);
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        System.out.println("[DEBUG] Marking all notifications as read for userId: " + userId + ", count: " + notifications.size());
        for (Notification n : notifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(notifications);
        System.out.println("[DEBUG] All notifications marked as read and saved.");
    }

    @Override
    public void deleteAll(String userId) {
        notificationRepository.deleteByUserId(userId);
    }

    @Override
    public void deleteById(String notificationId, String userId) {
        Notification n = notificationRepository.findById(notificationId).orElse(null);
        if (n != null && n.getUserId().equals(userId)) {
            notificationRepository.deleteById(notificationId);
        }
    }

    @Override
    public void createNotification(Notification notification) {
        notificationRepository.save(notification);
    }
} 