package com.plp.repository;

import com.plp.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByPostIdOrderByCreatedAtDesc(String postId);
    List<Comment> findByAuthorIdOrderByCreatedAtDesc(String authorId);
    Page<Comment> findByPostId(String postId, Pageable pageable);
    void deleteByPostId(String postId);
    /*comment */
} 