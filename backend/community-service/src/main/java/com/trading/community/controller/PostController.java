package com.trading.community.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.trading.community.dto.ApiResponse;
import com.trading.community.dto.CreatePostRequest;
import com.trading.community.dto.PostCommentRequest;
import com.trading.community.dto.PostCommentResponse;
import com.trading.community.dto.PostResponse;
import com.trading.community.dto.ReactionRequest;
import com.trading.community.security.UserPrincipal;
import com.trading.community.service.PostService;

@RestController
@RequestMapping("/api/community/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getFeed(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {
        Page<PostResponse> posts = postService.getFeed(page, size);
        return ResponseEntity.ok(ApiResponse.ok(posts));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {
        Page<PostResponse> posts = postService.getUserPosts(userId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(posts));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getGroupPosts(
            @PathVariable Long groupId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {
        Page<PostResponse> posts = postService.getGroupPosts(groupId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(posts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPostById(@PathVariable Long id) {
        PostResponse post = postService.getPostById(id);
        return ResponseEntity.ok(ApiResponse.ok(post));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        PostResponse post = postService.createPost(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Post created successfully", post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        postService.deletePost(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Post deleted successfully", null));
    }

    @PostMapping("/{id}/react")
    public ResponseEntity<ApiResponse<PostResponse>> reactToPost(
            @PathVariable Long id,
            @Valid @RequestBody ReactionRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        PostResponse post = postService.reactToPost(id, request.getType(), user);
        return ResponseEntity.ok(ApiResponse.ok(post));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<PostCommentResponse>>> getComments(@PathVariable Long id) {
        List<PostCommentResponse> comments = postService.getComments(id);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<PostCommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody PostCommentRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        PostCommentResponse comment = postService.addComment(id, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Comment added successfully", comment));
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<PostCommentResponse>> toggleCommentLike(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal user) {
        PostCommentResponse comment = postService.toggleCommentLike(commentId, user);
        return ResponseEntity.ok(ApiResponse.ok(comment));
    }
}
