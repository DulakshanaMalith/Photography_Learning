package com.plp.repository;

import com.plp.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findBySenderIdAndRecipientIdOrRecipientIdAndSenderIdOrderByTimestampAsc(
        String senderId1, String recipientId1, String senderId2, String recipientId2);
    
    Page<Message> findBySenderIdAndRecipientIdOrRecipientIdAndSenderIdOrderByTimestampDesc(
        String senderId1, String recipientId1, String senderId2, String recipientId2, Pageable pageable);
    
    long countBySenderIdAndRecipientIdOrRecipientIdAndSenderId(
        String senderId1, String recipientId1, String senderId2, String recipientId2);
    
    long countByRecipientIdAndReadFalse(String recipientId);
    
    Message findFirstBySenderIdAndRecipientIdOrRecipientIdAndSenderIdOrderByTimestampDesc(
        String senderId1, String recipientId1, String senderId2, String recipientId2);
} 