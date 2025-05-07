package com.plp.repository;

import com.plp.model.LearningPlan;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LearningPlanRepository extends MongoRepository<LearningPlan, String> {
    List<LearningPlan> findByAuthorIdOrderByCreatedAtDesc(String authorId);
    List<LearningPlan> findAllByOrderByCreatedAtDesc();
} 