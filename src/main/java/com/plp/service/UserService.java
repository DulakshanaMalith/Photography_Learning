package com.plp.service;

import com.plp.model.User;
import java.util.List;

public interface UserService {
    List<User> getAllUsers();
    User getUserById(String id);
    User getUserByEmail(String email);
    User saveUser(User user);
    void deleteUser(String id);
} 