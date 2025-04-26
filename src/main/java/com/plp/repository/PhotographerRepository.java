package com.plp.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.plp.model.Photographer;

public interface PhotographerRepository extends MongoRepository<Photographer, String> {
} 