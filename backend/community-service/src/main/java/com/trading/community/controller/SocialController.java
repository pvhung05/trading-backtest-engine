package com.trading.community.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.trading.community.dto.ApiResponse;
import com.trading.community.dto.FriendshipResponse;
import com.trading.community.dto.UserProfileResponse;
import com.trading.community.security.UserPrincipal;
import com.trading.community.service.SocialService;

@RestController
@RequestMapping("/api/community")
public class SocialController {

    private final SocialService socialService;

    public SocialController(SocialService socialService) {
        this.socialService = socialService;
    }

    @PostMapping("/friends/request/{targetUserId}")
    public ResponseEntity<ApiResponse<FriendshipResponse>> sendFriendRequest(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal user) {
        FriendshipResponse response = socialService.sendFriendRequest(targetUserId, user);
        return ResponseEntity.ok(ApiResponse.ok("Friend request sent", response));
    }

    @DeleteMapping("/friends/request/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> cancelFriendRequest(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal user) {
        socialService.cancelFriendRequest(targetUserId, user);
        return ResponseEntity.ok(ApiResponse.ok("Friend request cancelled", null));
    }

    @PostMapping("/friends/{friendshipId}/respond")
    public ResponseEntity<ApiResponse<FriendshipResponse>> respondFriendRequest(
            @PathVariable Long friendshipId,
            @RequestParam boolean accept,
            @AuthenticationPrincipal UserPrincipal user) {
        FriendshipResponse response = socialService.respondFriendRequest(friendshipId, accept, user);
        String msg = accept ? "Friend request accepted" : "Friend request rejected";
        return ResponseEntity.ok(ApiResponse.ok(msg, response));
    }

    @DeleteMapping("/friends/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> removeFriend(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal user) {
        socialService.removeFriend(targetUserId, user);
        return ResponseEntity.ok(ApiResponse.ok("Friend removed", null));
    }

    @GetMapping("/friends")
    public ResponseEntity<ApiResponse<Page<FriendshipResponse>>> getFriends(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal user) {
        Page<FriendshipResponse> friends = socialService.getFriends(user.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.ok(friends));
    }

    @GetMapping("/friends/pending")
    public ResponseEntity<ApiResponse<Page<FriendshipResponse>>> getPendingRequests(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal user) {
        Page<FriendshipResponse> pending = socialService.getPendingRequests(user.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.ok(pending));
    }

    @GetMapping("/friends/sent")
    public ResponseEntity<ApiResponse<Page<FriendshipResponse>>> getSentPendingRequests(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal user) {
        Page<FriendshipResponse> sent = socialService.getSentPendingRequests(user.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.ok(sent));
    }

    @PostMapping("/follow/{targetUserId}")
    public ResponseEntity<ApiResponse<Boolean>> followUser(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal user) {
        boolean followed = socialService.followUser(targetUserId, user);
        return ResponseEntity.ok(ApiResponse.ok("Follow status updated", followed));
    }

    @DeleteMapping("/follow/{targetUserId}")
    public ResponseEntity<ApiResponse<Boolean>> unfollowUser(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal user) {
        boolean unfollowed = socialService.unfollowUser(targetUserId, user);
        return ResponseEntity.ok(ApiResponse.ok("Unfollowed successfully", unfollowed));
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<ApiResponse<Page<UserProfileResponse>>> getFollowers(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        Page<UserProfileResponse> followers = socialService.getFollowers(userId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(followers));
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<ApiResponse<Page<UserProfileResponse>>> getFollowing(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        Page<UserProfileResponse> following = socialService.getFollowing(userId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(following));
    }
}
