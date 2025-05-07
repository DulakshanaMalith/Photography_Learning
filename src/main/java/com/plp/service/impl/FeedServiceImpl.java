package com.plp.service.impl;

import com.plp.model.Post;
import com.plp.model.Comment;
import com.plp.model.User;
import com.plp.model.Notification;
import com.plp.repository.PostRepository;
import com.plp.repository.CommentRepository;
import com.plp.repository.UserRepository;
import com.plp.service.FeedService;
import com.plp.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class FeedServiceImpl implements FeedService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;

    @Autowired
    public FeedServiceImpl(PostRepository postRepository, UserRepository userRepository, CommentRepository commentRepository, NotificationService notificationService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Cacheable(value = "posts", key = "'feed_' + #page + '_' + #size")
    public List<Post> getFeed(int page, int size) {
        Page<Post> postPage = postRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        List<Post> posts = postPage.getContent();
        
        // Load author data for each post
        for (Post post : posts) {
            if (post.getAuthor() != null && post.getAuthor().getEmail() != null) {
                User author = userRepository.findByEmail(post.getAuthor().getEmail())
                    .orElse(null);
                if (author != null) {
                    post.setAuthor(author);
                }
            }
            
            // Load comments for each post
            List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(post.getId());
            for (Comment comment : comments) {
                if (comment.getAuthor() != null && comment.getAuthor().getEmail() != null) {
                    User commentAuthor = userRepository.findByEmail(comment.getAuthor().getEmail())
                        .orElse(null);
                    if (commentAuthor != null) {
                        comment.setAuthor(commentAuthor);
                    }
                }
            }
            post.setCommentCount(comments.size());
        }
        
        return posts;
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public Post createPost(Post post) {
        if (post.getContent() == null || post.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Post content cannot be empty");
        }

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUsername)
            .orElseThrow(() -> new RuntimeException("User not found: " + currentUsername));
        post.setAuthor(currentUser);

        Date now = new Date();
        post.setCreatedAt(now);
        post.setUpdatedAt(now);
        post.setLikes(new ArrayList<>());
        post.setCommentCount(0);

        return postRepository.save(post);
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public Post updatePost(String postId, Post post) {
        Post existingPost = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        if (post.getContent() == null || post.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Post content cannot be empty");
        }

        post.setId(postId);
        post.setAuthor(existingPost.getAuthor());
        post.setCreatedAt(existingPost.getCreatedAt());
        post.setUpdatedAt(new Date());
        post.setLikes(existingPost.getLikes());
        post.setCommentCount(existingPost.getCommentCount());

        return postRepository.save(post);
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public void deletePost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isAuthor = post.getAuthor() != null && post.getAuthor().getEmail().equals(currentUsername);
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAuthor && !isAdmin) {
            throw new RuntimeException("You are not authorized to delete this post");
        }

        // Delete all comments associated with the post
        commentRepository.deleteByPostId(postId);
        
        // Delete the post
        postRepository.deleteById(postId);
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public Post likePost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<String> likes = post.getLikes();
        boolean isLike = false;
        if (likes.contains(currentUserEmail)) {
            likes.remove(currentUserEmail);
        } else {
            likes.add(currentUserEmail);
            isLike = true;
        }

        post.setLikes(likes);
        post.setUpdatedAt(new Date());
        Post savedPost = postRepository.save(post);

        // Send notification to post author if liked (not for self-like)
        if (isLike && post.getAuthor() != null && !post.getAuthor().getEmail().equals(currentUserEmail)) {
            User sender = userRepository.findByEmail(currentUserEmail).orElse(null);
            if (sender != null) {
                Notification notification = new Notification();
                notification.setUserId(post.getAuthor().getId());
                notification.setType("like");
                Notification.Sender senderInfo = new Notification.Sender();
                senderInfo.setId(sender.getId());
                senderInfo.setName(sender.getName());
                senderInfo.setAvatar(sender.getAvatar());
                notification.setSender(senderInfo);
                notification.setPostId(post.getId());
                notification.setRead(false);
                notification.setCreatedAt(new Date());
                System.out.println("[DEBUG] Creating notification for userId: " + notification.getUserId() + ", type: " + notification.getType() + ", sender: " + senderInfo.getName());
                notificationService.createNotification(notification);
            }
        }
        return savedPost;
    }

    @Override
    @CacheEvict(value = "comments", key = "'comments_' + #postId + '_' + #page + '_' + #size")
    public List<Comment> getComments(String postId, int page, int size) {
        // Verify post exists
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Get paginated comments
        Page<Comment> commentPage = commentRepository.findByPostId(postId, PageRequest.of(page, size));
        List<Comment> comments = commentPage.getContent();

        // Load author data for each comment
        for (Comment comment : comments) {
            if (comment.getAuthor() != null && comment.getAuthor().getEmail() != null) {
                User commentAuthor = userRepository.findByEmail(comment.getAuthor().getEmail())
                    .orElse(null);
                if (commentAuthor != null) {
                    comment.setAuthor(commentAuthor);
                }
            }
        }

        return comments;
    }

    @Override
    @CacheEvict(value = {"posts", "comments"}, allEntries = true)
    public Post addComment(String postId, Comment comment) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if (currentUserEmail == null || currentUserEmail.isEmpty()) {
            throw new RuntimeException("User not authenticated");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment newComment = new Comment();
        newComment.setId(java.util.UUID.randomUUID().toString());
        newComment.setContent(comment.getContent());
        newComment.setAuthor(currentUser);
        newComment.setPostId(postId);
        newComment.setCreatedAt(new Date());
        newComment.setUpdatedAt(new Date());

        // Save the comment
        Comment savedComment = commentRepository.save(newComment);

        // Update post's comment count
        post.incrementCommentCount();
        Post updatedPost = postRepository.save(post);

        // Send notification to post author if not self-comment
        if (post.getAuthor() != null && !post.getAuthor().getEmail().equals(currentUserEmail)) {
            Notification notification = new Notification();
            notification.setUserId(post.getAuthor().getId());
            notification.setType("comment");
            Notification.Sender senderInfo = new Notification.Sender();
            senderInfo.setId(currentUser.getId());
            senderInfo.setName(currentUser.getName());
            senderInfo.setAvatar(currentUser.getAvatar());
            notification.setSender(senderInfo);
            notification.setPostId(post.getId());
            notification.setRead(false);
            notification.setCreatedAt(new Date());
            System.out.println("[DEBUG] Creating notification for userId: " + notification.getUserId() + ", type: " + notification.getType() + ", sender: " + senderInfo.getName());
            notificationService.createNotification(notification);
        }
        return updatedPost;
    }

    @Override
    @CacheEvict(value = {"posts", "comments"}, allEntries = true)
    public Post updateComment(String postId, String commentId, Comment updatedComment) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if (currentUserEmail == null || currentUserEmail.isEmpty()) {
            throw new RuntimeException("User not authenticated");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment existingComment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!existingComment.getPostId().equals(postId)) {
            throw new RuntimeException("Comment does not belong to this post");
        }

        if (existingComment.getAuthor() == null || 
            !existingComment.getAuthor().getEmail().equals(currentUserEmail)) {
            throw new RuntimeException("You are not authorized to update this comment");
        }

        existingComment.setContent(updatedComment.getContent());
        existingComment.setUpdatedAt(new Date());

        // Save the updated comment
        commentRepository.save(existingComment);

        // Load all comments for the post
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
        
        return post;
    }

    @Override
    @CacheEvict(value = {"posts", "comments"}, allEntries = true)
    public Post deleteComment(String postId, String commentId) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if (currentUserEmail == null || currentUserEmail.isEmpty()) {
            throw new RuntimeException("User not authenticated");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getPostId().equals(postId)) {
            throw new RuntimeException("Comment does not belong to this post");
        }

        boolean isAuthor = comment.getAuthor() != null && 
                         comment.getAuthor().getEmail().equals(currentUserEmail);
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAuthor && !isAdmin) {
            throw new RuntimeException("You are not authorized to delete this comment");
        }

        // Delete the comment
        commentRepository.deleteById(commentId);

        // Update post's comment count
        post.decrementCommentCount();
        Post updatedPost = postRepository.save(post);

        // Load all comments for the post
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
        
        return updatedPost;
    }
} 