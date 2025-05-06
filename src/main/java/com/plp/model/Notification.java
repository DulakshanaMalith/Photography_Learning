package com.plp.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Date;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;

    @DBRef
    private User sender;

    @DBRef
    private User recipient;

    private String type; // like, comment
    private String content;

    @Field("post_id")
    private String postId;

    @Field("is_read")
    private boolean isRead = false;

    @Field("created_at")
    private Date createdAt = new Date();
} 