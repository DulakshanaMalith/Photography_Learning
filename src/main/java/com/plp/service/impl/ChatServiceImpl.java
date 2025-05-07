package com.plp.service.impl;

import com.plp.model.Message;
import com.plp.repository.MessageRepository;
import com.plp.service.ChatService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class ChatServiceImpl implements ChatService {

    private final MessageRepository messageRepository;
    private final MongoTemplate mongoTemplate;
    private static final Logger logger = LoggerFactory.getLogger(ChatServiceImpl.class);

    @Autowired
    public ChatServiceImpl(MessageRepository messageRepository, MongoTemplate mongoTemplate) {
        this.messageRepository = messageRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Message saveMessage(Message message) {
        if (message == null) {
            throw new IllegalArgumentException("Message cannot be null");
        }
        if (!StringUtils.hasText(message.getContent())) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }
        if (!StringUtils.hasText(message.getSenderId()) || !StringUtils.hasText(message.getRecipientId())) {
            throw new IllegalArgumentException("Sender and recipient IDs are required");
        }

        message.setTimestamp(LocalDateTime.now());
        message.setRead(false);
        return messageRepository.save(message);
    }

    @Override
    public List<Message> getMessages(String userId, String recipientId, int page, int size) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(recipientId)) {
            throw new IllegalArgumentException("User ID and recipient ID are required");
        }
        
        logger.debug("Retrieving messages for user {} and recipient {}, page: {}, size: {}", 
            userId, recipientId, page, size);
        
        try {
            // Create query to find messages between the two users
            Query query = new Query(
                new Criteria().orOperator(
                    Criteria.where("senderId").is(userId).and("recipientId").is(recipientId),
                    Criteria.where("senderId").is(recipientId).and("recipientId").is(userId)
                )
            );
            
            // Add pagination and sorting
            query.with(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp")));
            
            // Execute query
            List<Message> messages = mongoTemplate.find(query, Message.class);
            logger.debug("Found {} messages", messages.size());
            
            if (!messages.isEmpty()) {
                logger.debug("First message: {}", messages.get(0));
                logger.debug("Last message: {}", messages.get(messages.size() - 1));
            }
            
            // Mark unread messages as read
            messages.stream()
                .filter(msg -> msg.getRecipientId().equals(userId) && !msg.isRead())
                .forEach(msg -> {
                    msg.setRead(true);
                    mongoTemplate.save(msg);
                    logger.debug("Marked message {} as read", msg.get_id());
                });
            
            return messages;
        } catch (Exception e) {
            logger.error("Error retrieving messages: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve messages", e);
        }
    }

    @Override
    public Message getMessageById(String messageId) {
        if (!StringUtils.hasText(messageId)) {
            throw new IllegalArgumentException("Message ID is required");
        }
        return messageRepository.findById(messageId).orElse(null);
    }

    @Override
    public void markMessageAsRead(String messageId) {
        if (!StringUtils.hasText(messageId)) {
            throw new IllegalArgumentException("Message ID is required");
        }
        messageRepository.findById(messageId).ifPresent(message -> {
            message.setRead(true);
            messageRepository.save(message);
        });
    }

    @Override
    public void deleteMessage(String messageId) {
        if (!StringUtils.hasText(messageId)) {
            throw new IllegalArgumentException("Message ID is required");
        }
        messageRepository.findById(messageId).ifPresent(message -> {
            message.markAsDeleted();
            messageRepository.save(message);
        });
    }

    @Override
    public Message editMessage(String messageId, String newContent) {
        if (!StringUtils.hasText(messageId)) {
            throw new IllegalArgumentException("Message ID is required");
        }
        if (!StringUtils.hasText(newContent)) {
            throw new IllegalArgumentException("New content cannot be empty");
        }

        return messageRepository.findById(messageId)
            .map(message -> {
                message.setContent(newContent);
                message.markAsEdited();
                return messageRepository.save(message);
            })
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
    }

    @Override
    public void addReaction(String messageId, String userId, String reaction) {
        if (!StringUtils.hasText(messageId) || !StringUtils.hasText(userId) || !StringUtils.hasText(reaction)) {
            throw new IllegalArgumentException("Message ID, user ID, and reaction are required");
        }

        messageRepository.findById(messageId).ifPresent(message -> {
            message.addReaction(userId, reaction);
            messageRepository.save(message);
        });
    }

    @Override
    public void removeReaction(String messageId, String userId) {
        if (!StringUtils.hasText(messageId) || !StringUtils.hasText(userId)) {
            throw new IllegalArgumentException("Message ID and user ID are required");
        }

        messageRepository.findById(messageId).ifPresent(message -> {
            message.removeReaction(userId);
            messageRepository.save(message);
        });
    }

    @Override
    public List<Message> searchMessages(String userId, String query) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(query)) {
            throw new IllegalArgumentException("User ID and search query are required");
        }

        Query searchQuery = new Query(
            new Criteria().andOperator(
                Criteria.where("content").regex(query, "i"),
                new Criteria().orOperator(
                    Criteria.where("senderId").is(userId),
                    Criteria.where("recipientId").is(userId)
                )
            )
        );
        searchQuery.with(Sort.by(Sort.Direction.DESC, "timestamp"));

        return mongoTemplate.find(searchQuery, Message.class);
    }

    @Override
    public void archiveChat(String userId, String recipientId) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(recipientId)) {
            throw new IllegalArgumentException("User ID and recipient ID are required");
        }

        Query query = new Query(
            new Criteria().orOperator(
                Criteria.where("senderId").is(userId).and("recipientId").is(recipientId),
                Criteria.where("senderId").is(recipientId).and("recipientId").is(userId)
            )
        );
        Update update = new Update().set("metadata.archived", true);
        mongoTemplate.updateMulti(query, update, Message.class);
    }

    @Override
    public void unarchiveChat(String userId, String recipientId) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(recipientId)) {
            throw new IllegalArgumentException("User ID and recipient ID are required");
        }

        Query query = new Query(
            new Criteria().orOperator(
                Criteria.where("senderId").is(userId).and("recipientId").is(recipientId),
                Criteria.where("senderId").is(recipientId).and("recipientId").is(userId)
            )
        );
        Update update = new Update().set("metadata.archived", false);
        mongoTemplate.updateMulti(query, update, Message.class);
    }

    @Override
    public Map<String, Object> getChatMetadata(String userId, String recipientId) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(recipientId)) {
            throw new IllegalArgumentException("User ID and recipient ID are required");
        }

        Map<String, Object> metadata = new HashMap<>();
        
        // Get total message count
        long totalMessages = messageRepository.countBySenderIdAndRecipientIdOrRecipientIdAndSenderId(
            userId, recipientId, userId, recipientId);
        metadata.put("totalMessages", totalMessages);

        // Get unread message count
        long unreadMessages = messageRepository.countByRecipientIdAndReadFalse(userId);
        metadata.put("unreadMessages", unreadMessages);

        // Get last message
        Message lastMessage = messageRepository.findFirstBySenderIdAndRecipientIdOrRecipientIdAndSenderIdOrderByTimestampDesc(
            userId, recipientId, userId, recipientId);
        metadata.put("lastMessage", lastMessage);

        return metadata;
    }
} 