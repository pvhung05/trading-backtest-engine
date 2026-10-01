package com.trading.community.controller;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trading.community.dto.ApiResponse;
import com.trading.community.dto.UpdateUserProfileRequest;
import com.trading.community.dto.UserProfileResponse;
import com.trading.community.security.UserPrincipal;
import com.trading.community.service.UserProfileService;

@RestController
@RequestMapping("/api/community/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserPrincipal user) {
        userProfileService.getOrCreateProfile(user.getId(), user.getUsername(), user.getUsername(), null);
        UserProfileResponse profile = userProfileService.getProfileByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfileByUserId(@PathVariable Long userId) {
        UserProfileResponse profile = userProfileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/by-username/{username}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfileByUsername(@PathVariable String username) {
        UserProfileResponse profile = userProfileService.getProfileByUsername(username);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateUserProfileRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        UserProfileResponse updated = userProfileService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }
}
