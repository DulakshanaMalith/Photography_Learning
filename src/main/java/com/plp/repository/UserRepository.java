package com.plp.repository;

import com.plp.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    Boolean existsByEmail(String email);
} 