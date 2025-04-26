package com.plp.service;

import java.util.List;

import com.plp.model.Photographer;

public interface PhotographerService {
    List<Photographer> getAllPhotographers(int page, int size);
    Photographer getPhotographerById(String id);
    Photographer createPhotographer(Photographer photographer);
    Photographer updatePhotographer(String id, Photographer photographer);
    void deletePhotographer(String id);
} 