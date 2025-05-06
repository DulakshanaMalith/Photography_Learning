package com.plp.controller;

import com.plp.model.Post;
import com.plp.model.Comment;
import com.plp.service.FeedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feed")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class FeedController {

    @Autowired
    private FeedService feedService;

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<Post>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(feedService.getFeed(page, size));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        return ResponseEntity.ok(feedService.createPost(post));
    }

    @PutMapping("/{postId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Post> updatePost(@PathVariable String postId, @RequestBody Post post) {
        return ResponseEntity.ok(feedService.updatePost(postId, post));
    }

    @DeleteMapping("/{postId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> deletePost(@PathVariable String postId) {
        feedService.deletePost(postId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/like")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Post> likePost(@PathVariable String postId) {
        return ResponseEntity.ok(feedService.likePost(postId));
    }

    @GetMapping("/{postId}/comments")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<Comment>> getComments(
            @PathVariable String postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(feedService.getComments(postId, page, size));
    }

    @PostMapping("/{postId}/comments")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable String postId,
            @RequestBody Comment comment) {
        Post updatedPost = feedService.addComment(postId, comment);
        List<Comment> comments = feedService.getComments(postId, 0, 10);
        return ResponseEntity.ok(Map.of(
            "post", updatedPost,
            "comments", comments
        ));
    }

    @PutMapping("/{postId}/comments/{commentId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> updateComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            @RequestBody Comment comment) {
        Post updatedPost = feedService.updateComment(postId, commentId, comment);
        List<Comment> comments = feedService.getComments(postId, 0, 10);
        return ResponseEntity.ok(Map.of(
            "post", updatedPost,
            "comments", comments
        ));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable String postId,
            @PathVariable String commentId) {
        Post updatedPost = feedService.deleteComment(postId, commentId);
        List<Comment> comments = feedService.getComments(postId, 0, 10);
        return ResponseEntity.ok(Map.of(
            "post", updatedPost,
            "comments", comments
        ));
    }
} 