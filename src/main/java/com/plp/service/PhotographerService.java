package com.plp.service;

import com.plp.model.Photographer;
import java.util.List;

public interface PhotographerService {
    List<Photographer> getAllPhotographers(int page, int size);
    Photographer getPhotographerById(String id);
    Photographer createPhotographer(Photographer photographer);
    Photographer updatePhotographer(String id, Photographer photographer);
    void deletePhotographer(String id);
} 