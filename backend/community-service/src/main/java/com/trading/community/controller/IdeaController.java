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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.trading.community.dto.ApiResponse;
import com.trading.community.dto.CreateIdeaRequest;
import com.trading.community.dto.IdeaCommentRequest;
import com.trading.community.dto.IdeaCommentResponse;
import com.trading.community.dto.TradingIdeaResponse;
import com.trading.community.dto.UpdateIdeaRequest;
import com.trading.community.security.UserPrincipal;
import com.trading.community.service.IdeaService;

@RestController
@RequestMapping("/api/community/ideas")
public class IdeaController {

    private final IdeaService ideaService;

    public IdeaController(IdeaService ideaService) {
        this.ideaService = ideaService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TradingIdeaResponse>>> getIdeas(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "popular") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size) {
        Page<TradingIdeaResponse> ideas = ideaService.getIdeas(category, query, sort, page, size);
        return ResponseEntity.ok(ApiResponse.ok(ideas));
    }

    @GetMapping("/bookmarked")
    public ResponseEntity<ApiResponse<Page<TradingIdeaResponse>>> getBookmarkedIdeas(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size,
            @AuthenticationPrincipal UserPrincipal user) {
        Page<TradingIdeaResponse> ideas = ideaService.getBookmarkedIdeas(page, size, user);
        return ResponseEntity.ok(ApiResponse.ok(ideas));
    }

    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<ApiResponse<Page<TradingIdeaResponse>>> getIdeasBySymbol(
            @PathVariable String symbol,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size) {
        Page<TradingIdeaResponse> ideas = ideaService.getIdeasBySymbol(symbol, page, size);
        return ResponseEntity.ok(ApiResponse.ok(ideas));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TradingIdeaResponse>> getIdeaById(@PathVariable Long id) {
        TradingIdeaResponse idea = ideaService.getIdeaById(id);
        return ResponseEntity.ok(ApiResponse.ok(idea));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<IdeaCommentResponse>>> getComments(@PathVariable Long id) {
        List<IdeaCommentResponse> comments = ideaService.getComments(id);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<ApiResponse<List<TradingIdeaResponse>>> getRelatedIdeas(@PathVariable Long id) {
        List<TradingIdeaResponse> related = ideaService.getRelatedIdeas(id);
        return ResponseEntity.ok(ApiResponse.ok(related));
    }

    @GetMapping("/{id}/author-ideas")
    public ResponseEntity<ApiResponse<List<TradingIdeaResponse>>> getAuthorIdeas(
            @PathVariable Long id,
            @RequestParam Long authorId) {
        List<TradingIdeaResponse> ideas = ideaService.getAuthorIdeas(authorId, id);
        return ResponseEntity.ok(ApiResponse.ok(ideas));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TradingIdeaResponse>> createIdea(
            @Valid @RequestBody CreateIdeaRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        TradingIdeaResponse created = ideaService.createIdea(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Trading idea published successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TradingIdeaResponse>> updateIdea(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIdeaRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        TradingIdeaResponse updated = ideaService.updateIdea(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Trading idea updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIdea(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        ideaService.deleteIdea(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Trading idea deleted successfully", null));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<TradingIdeaResponse>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        TradingIdeaResponse idea = ideaService.toggleLikeIdea(id, user);
        return ResponseEntity.ok(ApiResponse.ok(idea));
    }

    @PostMapping("/{id}/boost")
    public ResponseEntity<ApiResponse<TradingIdeaResponse>> boostIdea(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        TradingIdeaResponse idea = ideaService.boostIdea(id, user);
        return ResponseEntity.ok(ApiResponse.ok(idea));
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<ApiResponse<TradingIdeaResponse>> toggleBookmark(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        TradingIdeaResponse idea = ideaService.toggleBookmark(id, user);
        return ResponseEntity.ok(ApiResponse.ok(idea));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<IdeaCommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody IdeaCommentRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        IdeaCommentResponse comment = ideaService.addComment(id, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Comment added successfully", comment));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal user) {
        ideaService.deleteComment(id, commentId, user);
        return ResponseEntity.ok(ApiResponse.ok("Comment deleted successfully", null));
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<IdeaCommentResponse>> toggleCommentLike(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal user) {
        IdeaCommentResponse comment = ideaService.toggleCommentLike(commentId, user);
        return ResponseEntity.ok(ApiResponse.ok(comment));
    }
}
