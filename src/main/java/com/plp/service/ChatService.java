package com.plp.service;

import java.util.List;
import java.util.Map;

import com.plp.model.Message;

public interface ChatService {
    Message saveMessage(Message message);
    List<Message> getMessages(String userId, String recipientId, int page, int size);
    Message getMessageById(String messageId);
    void markMessageAsRead(String messageId);
    void deleteMessage(String messageId);
    Message editMessage(String messageId, String newContent);
    void addReaction(String messageId, String userId, String reaction);
    void removeReaction(String messageId, String userId);
    List<Message> searchMessages(String userId, String query);
    void archiveChat(String userId, String recipientId);
    void unarchiveChat(String userId, String recipientId);
    Map<String, Object> getChatMetadata(String userId, String recipientId);
} 