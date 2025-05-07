package com.plp.service;

import com.plp.model.LearningPlan;
import java.util.List;

public interface LearningPlanService {
    List<LearningPlan> getAllLearningPlans(int page, int size);
    LearningPlan getLearningPlanById(String id);
    LearningPlan createLearningPlan(LearningPlan learningPlan);
    LearningPlan updateLearningPlan(String id, LearningPlan learningPlan);
    void deleteLearningPlan(String id);
} 