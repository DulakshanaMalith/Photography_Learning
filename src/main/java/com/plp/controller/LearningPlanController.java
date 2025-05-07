package com.plp.controller;

import com.plp.model.LearningPlan;
import com.plp.service.LearningPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning-plans")
public class LearningPlanController {

    @Autowired
    private LearningPlanService learningPlanService;

    @GetMapping
    public ResponseEntity<List<LearningPlan>> getAllLearningPlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(learningPlanService.getAllLearningPlans(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningPlan> getLearningPlanById(@PathVariable String id) {
        return ResponseEntity.ok(learningPlanService.getLearningPlanById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<LearningPlan> createLearningPlan(@RequestBody LearningPlan learningPlan) {
        return ResponseEntity.ok(learningPlanService.createLearningPlan(learningPlan));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<LearningPlan> updateLearningPlan(@PathVariable String id, @RequestBody LearningPlan learningPlan) {
        return ResponseEntity.ok(learningPlanService.updateLearningPlan(id, learningPlan));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Void> deleteLearningPlan(@PathVariable String id) {
        learningPlanService.deleteLearningPlan(id);
        return ResponseEntity.ok().build();
    }
} 