package com.plp.repository;

import com.plp.model.Photographer;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PhotographerRepository extends MongoRepository<Photographer, String> {
} 