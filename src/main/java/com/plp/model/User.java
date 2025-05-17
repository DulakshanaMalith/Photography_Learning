package com.plp.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;
import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.HashSet;
import java.util.Set;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    @Getter @Setter
    private String id;

    @Getter @Setter
    private String name;

    @Getter @Setter
    private String email;

    @Getter @Setter
    private String password;

    @Getter @Setter
    private String avatar;

    @Getter @Setter
    private String googleId;

    @Field("phone_number")
    @Getter @Setter
    private String phoneNumber;

    @Field("qualifications")
    @Getter @Setter
    private String qualifications;

    @Field("budget")
    @Getter @Setter
    private String budget;

    @Field("portfolio_url")
    @Getter @Setter
    private String portfolioUrl;

    @Field("roles")
    @Getter @Setter
    private Set<String> roles = new HashSet<>();

    @Getter @Setter
    private String username;

    @Getter @Setter
    private String role;

    @Getter @Setter
    private boolean online;

    @Getter @Setter
    private Long unreadCount;

    @Getter @Setter
    private String lastMessage;

    @Getter @Setter
    private boolean archived;

    @Getter @Setter
    private LocalDateTime lastSeen;

    public User() {
        this.roles.add("ROLE_USER");
    }

    // Explicit getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }

    public void setUnreadCount(Long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public void setLastMessage(String lastMessage) {
        this.lastMessage = lastMessage;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
} 