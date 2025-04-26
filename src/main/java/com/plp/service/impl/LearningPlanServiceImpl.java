package com.plp.service.impl;

import com.plp.model.LearningPlan;
import com.plp.model.User;
import com.plp.repository.LearningPlanRepository;
import com.plp.repository.UserRepository;
import com.plp.service.LearningPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class LearningPlanServiceImpl implements LearningPlanService {

    private final LearningPlanRepository learningPlanRepository;
    private final UserRepository userRepository;

    @Autowired
    public LearningPlanServiceImpl(LearningPlanRepository learningPlanRepository, UserRepository userRepository) {
        this.learningPlanRepository = learningPlanRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<LearningPlan> getAllLearningPlans(int page, int size) {
        Page<LearningPlan> learningPlanPage = learningPlanRepository.findAll(PageRequest.of(page, size));
        return learningPlanPage.getContent();
    }

    @Override
    public LearningPlan getLearningPlanById(String id) {
        return learningPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Learning plan not found with id: " + id));
    }

    @Override
    public LearningPlan createLearningPlan(LearningPlan learningPlan) {
        if (learningPlan.getAuthor() == null || learningPlan.getAuthor().getId() == null) {
            throw new RuntimeException("Author is required for creating a learning plan");
        }

        // Set timestamps
        learningPlan.setCreatedAt(new Date());
        learningPlan.setUpdatedAt(new Date());

        // Verify author exists
        User author = userRepository.findById(learningPlan.getAuthor().getId())
                .orElseThrow(() -> new RuntimeException("Author not found with id: " + learningPlan.getAuthor().getId()));
        learningPlan.setAuthor(author);

        return learningPlanRepository.save(learningPlan);
    }

    @Override
    public LearningPlan updateLearningPlan(String id, LearningPlan learningPlan) {
        LearningPlan existingPlan = learningPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Learning plan not found with id: " + id));

        // Update fields
        existingPlan.setTitle(learningPlan.getTitle());
        existingPlan.setDescription(learningPlan.getDescription());
        existingPlan.setDuration(learningPlan.getDuration());
        existingPlan.setLevel(learningPlan.getLevel());
        existingPlan.setTopics(learningPlan.getTopics());
        existingPlan.setUpdatedAt(new Date());

        return learningPlanRepository.save(existingPlan);
    }

    @Override
    public void deleteLearningPlan(String id) {
        if (!learningPlanRepository.existsById(id)) {
            throw new RuntimeException("Learning plan not found with id: " + id);
        }
        learningPlanRepository.deleteById(id);
    }
} 