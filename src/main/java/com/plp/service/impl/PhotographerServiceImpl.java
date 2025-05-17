package com.plp.service.impl;

import com.plp.model.Photographer;
import com.plp.repository.PhotographerRepository;
import com.plp.service.PhotographerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class PhotographerServiceImpl implements PhotographerService {

    private final PhotographerRepository photographerRepository;

    @Autowired
    public PhotographerServiceImpl(PhotographerRepository photographerRepository) {
        this.photographerRepository = photographerRepository;
    }

    @Override
    public List<Photographer> getAllPhotographers(int page, int size) {
        Page<Photographer> photographerPage = photographerRepository.findAll(PageRequest.of(page, size));
        return photographerPage.getContent();
    }

    @Override
    public Photographer getPhotographerById(String id) {
        return photographerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Photographer not found with id: " + id));
    }

    @Override
    public Photographer createPhotographer(Photographer photographer) {
        // Validate required fields
        if (photographer.getName() == null || photographer.getName().trim().isEmpty()) {
            throw new RuntimeException("Name is required for creating a photographer");
        }
        if (photographer.getEmail() == null || photographer.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required for creating a photographer");
        }

        // Set default values if not provided
        if (photographer.getQualifications() == null) {
            photographer.setQualifications("Not specified");
        }
        if (photographer.getBudget() == null) {
            photographer.setBudget("$0");
        }

        // Set timestamps
        photographer.setCreatedAt(new Date());
        photographer.setUpdatedAt(new Date());

        return photographerRepository.save(photographer);
    }

    @Override
    public Photographer updatePhotographer(String id, Photographer photographer) {
        Photographer existingPhotographer = photographerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Photographer not found with id: " + id));

        // Update only non-null fields
        if (photographer.getName() != null) {
            existingPhotographer.setName(photographer.getName());
        }
        if (photographer.getEmail() != null) {
            existingPhotographer.setEmail(photographer.getEmail());
        }
        if (photographer.getPhoneNumber() != null) {
            existingPhotographer.setPhoneNumber(photographer.getPhoneNumber());
        }
        if (photographer.getLocation() != null) {
            existingPhotographer.setLocation(photographer.getLocation());
        }
        if (photographer.getSpecialties() != null) {
            existingPhotographer.setSpecialties(photographer.getSpecialties());
        }
        if (photographer.getExperience() != null) {
            existingPhotographer.setExperience(photographer.getExperience());
        }
        if (photographer.getPortfolioUrl() != null) {
            existingPhotographer.setPortfolioUrl(photographer.getPortfolioUrl());
        }
        if (photographer.getAvatarUrl() != null) {
            existingPhotographer.setAvatarUrl(photographer.getAvatarUrl());
        }
        if (photographer.getQualifications() != null) {
            existingPhotographer.setQualifications(photographer.getQualifications());
        }
        if (photographer.getBudget() != null) {
            existingPhotographer.setBudget(photographer.getBudget());
        }
        
        existingPhotographer.setUpdatedAt(new Date());

        return photographerRepository.save(existingPhotographer);
    }

    @Override
    public void deletePhotographer(String id) {
        if (!photographerRepository.existsById(id)) {
            throw new RuntimeException("Photographer not found with id: " + id);
        }
        photographerRepository.deleteById(id);
    }
} 