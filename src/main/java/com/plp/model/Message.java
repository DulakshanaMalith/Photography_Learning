package com.plp.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Getter
@Setter
@Document(collection = "messages")
public class Message {
    @Id
    private String _id;
    private String senderId;
    private String recipientId;
    private String content;
    private LocalDateTime timestamp;
    private boolean read;
    private MessageStatus status;
    private MessageType type;
    private boolean deleted;
    private boolean edited;
    private LocalDateTime editedAt;
    private Map<String, String> reactions;
    private Map<String, Object> metadata;

    public enum MessageStatus {
        SENT,
        DELIVERED,
        READ
    }

    public enum MessageType {
        TEXT,
        IMAGE,
        FILE,
        SYSTEM
    }

    public Message() {
        this.timestamp = LocalDateTime.now();
        this.read = false;
        this.status = MessageStatus.SENT;
        this.type = MessageType.TEXT;
        this.deleted = false;
        this.edited = false;
        this.reactions = new HashMap<>();
        this.metadata = new HashMap<>();
    }

    // Getter and setter for _id
    public String get_id() {
        return _id;
    }

    public void set_id(String _id) {
        this._id = _id;
    }

    // Additional getters and setters for compatibility
    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(String recipientId) {
        this.recipientId = recipientId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public void addReaction(String userId, String reaction) {
        reactions.put(userId, reaction);
    }

    public void removeReaction(String userId) {
        reactions.remove(userId);
    }

    public void markAsEdited() {
        this.edited = true;
        this.editedAt = LocalDateTime.now();
    }

    public void markAsDeleted() {
        this.deleted = true;
        this.content = "This message was deleted";
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }

    public MessageStatus getStatus() {
        return status;
    }
} 