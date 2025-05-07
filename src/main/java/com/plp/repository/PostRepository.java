package com.plp.repository;

import com.plp.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByAuthorIdOrderByCreatedAtDesc(String authorId);
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
} 