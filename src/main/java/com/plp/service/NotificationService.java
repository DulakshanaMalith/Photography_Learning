package com.plp.service;

import com.plp.model.Notification;
import java.util.List;

public interface NotificationService {
    List<Notification> getUserNotifications(String userId);
    void markAllAsRead(String userId);
    void deleteAll(String userId);
    void deleteById(String notificationId, String userId);
    void createNotification(Notification notification);
} 