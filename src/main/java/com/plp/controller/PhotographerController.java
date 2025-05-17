package com.plp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.plp.model.Photographer;
import com.plp.service.PhotographerService;

@RestController
@RequestMapping("/api/photographers")
public class PhotographerController {

    @Autowired
    private PhotographerService photographerService;

    @GetMapping
    public ResponseEntity<List<Photographer>> getAllPhotographers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(photographerService.getAllPhotographers(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Photographer> getPhotographerById(@PathVariable String id) {
        return ResponseEntity.ok(photographerService.getPhotographerById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Photographer> createPhotographer(@RequestBody Photographer photographer) {
        return ResponseEntity.ok(photographerService.createPhotographer(photographer));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Photographer> updatePhotographer(@PathVariable String id, @RequestBody Photographer photographer) {
        return ResponseEntity.ok(photographerService.updatePhotographer(id, photographer));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> deletePhotographer(@PathVariable String id, Authentication authentication) {
        photographerService.deletePhotographer(id);
        return ResponseEntity.ok().build();
    }
} 