package com.plp.controller;

import com.plp.model.Message;
import com.plp.model.User;
import com.plp.service.ChatService;
import com.plp.service.UserService;
import com.plp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;
import com.plp.model.Notification;

@Controller
@RequestMapping("/api/chat")
public class ChatController {
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final UserService userService;
    private final NotificationService notificationService;

    @Autowired
    public ChatController(
        SimpMessagingTemplate messagingTemplate,
        ChatService chatService,
        UserService userService,
        NotificationService notificationService
    ) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @MessageMapping("/chat")
    public void handleChatMessage(@Payload Message message, SimpMessageHeaderAccessor headerAccessor) {
        logger.debug("Received chat message: {}", message);
        
        try {
            // Set initial status as SENT
            message.setStatus(Message.MessageStatus.SENT);
            
            // Save the message
            Message savedMessage = chatService.saveMessage(message);
            logger.debug("Saved message: {}", savedMessage);
            
            // Send to recipient
            messagingTemplate.convertAndSendToUser(
                message.getRecipientId(),
                "/queue/messages",
                savedMessage
            );
            
            // Send to sender for real-time update
            messagingTemplate.convertAndSendToUser(
                message.getSenderId(),
                "/queue/messages",
                savedMessage
            );

            // Create notification for recipient
            System.out.println("[DEBUG] senderId: " + message.getSenderId() + ", recipientId: " + message.getRecipientId());
            User sender = userService.getUserById(message.getSenderId());
            if (sender == null) {
                System.out.println("[DEBUG] Sender not found for senderId: " + message.getSenderId());
            }
            if (sender != null && !message.getSenderId().equals(message.getRecipientId())) {
                Notification notification = new Notification();
                notification.setUserId(message.getRecipientId());
                notification.setType("message");
                Notification.Sender senderInfo = new Notification.Sender();
                senderInfo.setId(sender.getId());
                senderInfo.setName(sender.getName());
                senderInfo.setAvatar(sender.getAvatar());
                notification.setSender(senderInfo);
                notification.setPostId(savedMessage.get_id()); // Use postId field for messageId
                notification.setRead(false);
                notification.setCreatedAt(new java.util.Date());
                notificationService.createNotification(notification);
                System.out.println("[DEBUG] Created message notification for userId: " + notification.getUserId() + ", sender: " + senderInfo.getName());
            } else {
                System.out.println("[DEBUG] Notification not created: sender is null or senderId == recipientId");
            }
            
            logger.debug("Message sent to both sender and recipient");
        } catch (Exception e) {
            logger.error("Error handling chat message: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/message/read")
    public void handleMessageRead(@Payload Map<String, String> payload) {
        try {
            String messageId = payload.get("messageId");
            String userId = payload.get("userId");
            logger.debug("Message read: {} by user: {}", messageId, userId);
            
            Message message = chatService.getMessageById(messageId);
            if (message != null && message.getRecipientId().equals(userId)) {
                message.setStatus(Message.MessageStatus.READ);
                Message updatedMessage = chatService.saveMessage(message);
                
                // Notify sender about read status
                messagingTemplate.convertAndSendToUser(
                    message.getSenderId(),
                    "/queue/messages",
                    updatedMessage
                );
            }
        } catch (Exception e) {
            logger.error("Error handling message read status: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/message/edit")
    public void handleMessageEdit(@Payload Map<String, String> payload) {
        try {
            String messageId = payload.get("messageId");
            String content = payload.get("content");
            String userId = payload.get("userId");
            logger.debug("Message edit: {} by user: {}", messageId, userId);
            
            Message message = chatService.getMessageById(messageId);
            if (message != null && message.getSenderId().equals(userId)) {
                Message editedMessage = chatService.editMessage(messageId, content);
                
                // Notify both users about the edit
                messagingTemplate.convertAndSendToUser(
                    message.getSenderId(),
                    "/queue/messages",
                    editedMessage
                );
                messagingTemplate.convertAndSendToUser(
                    message.getRecipientId(),
                    "/queue/messages",
                    editedMessage
                );
            }
        } catch (Exception e) {
            logger.error("Error handling message edit: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/message/delete")
    public void handleMessageDelete(@Payload Map<String, String> payload) {
        try {
            String messageId = payload.get("messageId");
            String userId = payload.get("userId");
            logger.debug("Message delete: {} by user: {}", messageId, userId);
            
            Message message = chatService.getMessageById(messageId);
            if (message != null && message.getSenderId().equals(userId)) {
                chatService.deleteMessage(messageId);
                // Fetch the updated (deleted) message
                Message updatedMessage = chatService.getMessageById(messageId);
                // Notify both users about the deletion
                messagingTemplate.convertAndSendToUser(
                    updatedMessage.getSenderId(),
                    "/queue/messages",
                    updatedMessage
                );
                messagingTemplate.convertAndSendToUser(
                    updatedMessage.getRecipientId(),
                    "/queue/messages",
                    updatedMessage
                );
            }
        } catch (Exception e) {
            logger.error("Error handling message deletion: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/message/react")
    public void handleMessageReaction(@Payload Map<String, String> payload) {
        try {
            String messageId = payload.get("messageId");
            String userId = payload.get("userId");
            String reaction = payload.get("reaction");
            logger.debug("Message reaction: {} by user: {} with reaction: {}", messageId, userId, reaction);
            
            Message message = chatService.getMessageById(messageId);
            if (message != null) {
                chatService.addReaction(messageId, userId, reaction);
                Message updatedMessage = chatService.getMessageById(messageId);
                
                // Notify both users about the reaction
                messagingTemplate.convertAndSendToUser(
                    message.getSenderId(),
                    "/queue/messages",
                    updatedMessage
                );
                messagingTemplate.convertAndSendToUser(
                    message.getRecipientId(),
                    "/queue/messages",
                    updatedMessage
                );
            }
        } catch (Exception e) {
            logger.error("Error handling message reaction: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/users")
    public void handleUsersRequest(@Payload Map<String, String> payload) {
        try {
            String userId = payload.get("userId");
            logger.debug("Received users request for userId: {}", userId);
            
            List<User> users = userService.getAllUsers().stream()
                .filter(user -> !user.getId().equals(userId))
                .collect(Collectors.toList());
            
            // Get chat metadata for each user
            users.forEach(user -> {
                Map<String, Object> metadata = chatService.getChatMetadata(userId, user.getId());
                user.setUnreadCount((Long) metadata.get("unreadMessages"));
                Message lastMessage = (Message) metadata.get("lastMessage");
                if (lastMessage != null) {
                    user.setLastMessage(lastMessage.getContent());
                }
            });
            
            logger.debug("Sending users list: {}", users);
            messagingTemplate.convertAndSend("/topic/users", users);
        } catch (Exception e) {
            logger.error("Error handling users request: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/messages")
    public void handleMessagesRequest(@Payload Map<String, String> payload) {
        try {
            String userId = payload.get("userId");
            String recipientId = payload.get("recipientId");
            int page = Integer.parseInt(payload.getOrDefault("page", "0"));
            int size = Integer.parseInt(payload.getOrDefault("size", "20"));
            logger.debug("Received messages request: userId={}, recipientId={}, page={}, size={}", 
                userId, recipientId, page, size);
            
            List<Message> messages = chatService.getMessages(userId, recipientId, page, size);
            logger.debug("Retrieved {} messages", messages.size());
            
            if (!messages.isEmpty()) {
                logger.debug("First message timestamp: {}", messages.get(0).getTimestamp());
                logger.debug("Last message timestamp: {}", messages.get(messages.size() - 1).getTimestamp());
                logger.debug("Message contents: {}", messages.stream()
                    .map(m -> String.format("{id: %s, content: %s, timestamp: %s}", 
                        m.get_id(), m.getContent(), m.getTimestamp()))
                    .collect(Collectors.joining(", ")));
            }
            
            // Send messages to the user
            logger.debug("Sending messages to user: {}", userId);
            messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/messages",
                messages,
                Map.of(
                    "content-type", "application/json",
                    "message-type", "BATCH"
                )
            );
            logger.debug("Messages sent successfully to user: {}", userId);
            
        } catch (Exception e) {
            logger.error("Error handling messages request: {}", e.getMessage(), e);
            // Send error message to the user
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load messages");
            errorResponse.put("message", e.getMessage());
            
            messagingTemplate.convertAndSendToUser(
                payload.get("userId"),
                "/queue/errors",
                errorResponse,
                Map.of("content-type", "application/json")
            );
        }
    }

    @MessageMapping("/messages/search")
    public void handleMessageSearch(@Payload Map<String, String> payload) {
        try {
            String userId = payload.get("userId");
            String query = payload.get("query");
            logger.debug("Received message search request for userId: {} with query: {}", userId, query);
            
            List<Message> messages = chatService.searchMessages(userId, query);
            logger.debug("Found messages: {}", messages);
            
            messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/messages",
                messages
            );
        } catch (Exception e) {
            logger.error("Error handling message search: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat/archive")
    public void handleChatArchive(@Payload Map<String, String> payload) {
        try {
            String userId = payload.get("userId");
            String recipientId = payload.get("recipientId");
            logger.debug("Received chat archive request for userId: {} and recipientId: {}", userId, recipientId);
            
            chatService.archiveChat(userId, recipientId);
            
            // Notify both users about the archive
            messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/messages",
                Map.of("type", "ARCHIVE", "recipientId", recipientId)
            );
            messagingTemplate.convertAndSendToUser(
                recipientId,
                "/queue/messages",
                Map.of("type", "ARCHIVE", "recipientId", userId)
            );
        } catch (Exception e) {
            logger.error("Error handling chat archive: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/message/delivered")
    public void handleMessageDelivered(@Payload Map<String, String> payload) {
        try {
            String messageId = payload.get("messageId");
            String userId = payload.get("userId");
            logger.debug("Message delivered: {} by user: {}", messageId, userId);
            
            Message message = chatService.getMessageById(messageId);
            if (message != null && message.getRecipientId().equals(userId)) {
                message.setStatus(Message.MessageStatus.DELIVERED);
                Message updatedMessage = chatService.saveMessage(message);
                // Notify sender about delivered status
                messagingTemplate.convertAndSendToUser(
                    message.getSenderId(),
                    "/queue/messages",
                    updatedMessage
                );
            }
        } catch (Exception e) {
            logger.error("Error handling message delivered status: {}", e.getMessage(), e);
        }
    }

    @PostMapping("/upload-audio")
    public ResponseEntity<?> uploadAudio(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            logger.error("Audio upload failed: No file uploaded");
            return ResponseEntity.badRequest().body("No file uploaded");
        }
        try {
            String uploadDir = "uploads/audio/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();
            String ext = file.getOriginalFilename() != null && file.getOriginalFilename().contains(".") ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.')) : ".webm";
            String filename = UUID.randomUUID().toString() + ext;
            Path filePath = Paths.get(uploadDir, filename);
            Files.write(filePath, file.getBytes());
            String fileUrl = "/" + uploadDir + filename;
            logger.info("Audio uploaded: path={}, size={} bytes, url={}", filePath.toAbsolutePath(), file.getSize(), fileUrl);
            return ResponseEntity.ok().body(Map.of("url", fileUrl));
        } catch (IOException e) {
            logger.error("Failed to upload audio: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload audio");
        }
    }
} 