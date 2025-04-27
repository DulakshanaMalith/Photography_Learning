package com.plp.service;

import com.plp.model.Post;
import com.plp.model.Comment;
import java.util.List;

public interface FeedService {
    List<Post> getFeed(int page, int size);
    Post createPost(Post post);
    Post updatePost(String postId, Post post);
    void deletePost(String postId);
    Post likePost(String postId);
    List<Comment> getComments(String postId, int page, int size);
    Post addComment(String postId, Comment comment);
    Post updateComment(String postId, String commentId, Comment comment);
    Post deleteComment(String postId, String commentId);
} 