package com.trading.community.service;

import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trading.community.dto.AuthorDto;
import com.trading.community.dto.UpdateUserProfileRequest;
import com.trading.community.dto.UserDto;
import com.trading.community.dto.UserProfileResponse;
import com.trading.community.model.UserProfile;
import com.trading.community.repository.FollowRepository;
import com.trading.community.repository.FriendshipRepository;
import com.trading.community.repository.UserProfileRepository;
import com.trading.community.security.SecurityUtils;
import com.trading.community.security.UserPrincipal;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final FollowRepository followRepository;
    private final FriendshipRepository friendshipRepository;

    public UserProfileService(UserProfileRepository userProfileRepository,
                              FollowRepository followRepository,
                              FriendshipRepository friendshipRepository) {
        this.userProfileRepository = userProfileRepository;
        this.followRepository = followRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional
    public UserProfile getOrCreateProfile(Long userId, String username, String displayName, String avatarUrl) {
        return userProfileRepository.findById(userId).orElseGet(() -> {
            UserProfile profile = UserProfile.builder()
                    .userId(userId)
                    .username(username != null ? username : "user_" + userId)
                    .displayName(displayName != null ? displayName : (username != null ? username : "Trader #" + userId))
                    .avatarUrl(avatarUrl != null ? avatarUrl : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + userId)
                    .reputation(100)
                    .followersCount(0)
                    .followingCount(0)
                    .ideasCount(0)
                    .isOnline(true)
                    .build();
            return userProfileRepository.save(profile);
        });
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByUserId(Long targetUserId) {
        UserProfile profile = userProfileRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found: " + targetUserId));
        return buildProfileResponse(profile);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByUsername(String username) {
        UserProfile profile = userProfileRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return buildProfileResponse(profile);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateUserProfileRequest request) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            profile.setDisplayName(request.getDisplayName().trim());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl().trim());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio().trim());
        }

        UserProfile saved = userProfileRepository.save(profile);
        return buildProfileResponse(saved);
    }

    public AuthorDto toAuthorDto(UserProfile profile) {
        return AuthorDto.builder()
                .id(String.valueOf(profile.getUserId()))
                .name(profile.getDisplayName())
                .username(profile.getUsername())
                .avatarUrl(profile.getAvatarUrl())
                .badge(profile.getBadge())
                .reputation(profile.getReputation())
                .followersCount(profile.getFollowersCount())
                .build();
    }

    public UserDto toUserDto(UserProfile profile) {
        return UserDto.builder()
                .id(String.valueOf(profile.getUserId()))
                .name(profile.getDisplayName())
                .username(profile.getUsername())
                .avatarUrl(profile.getAvatarUrl())
                .email(null)
                .isOnline(profile.getIsOnline())
                .build();
    }

    private UserProfileResponse buildProfileResponse(UserProfile profile) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        String friendStatus = "not_friend";
        boolean isFollowing = false;

        if (currentUserId != null && !currentUserId.equals(profile.getUserId())) {
            isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUserId, profile.getUserId());
            var friendshipOpt = friendshipRepository.findBetweenUsers(currentUserId, profile.getUserId());
            if (friendshipOpt.isPresent()) {
                var f = friendshipOpt.get();
                if ("ACCEPTED".equalsIgnoreCase(f.getStatus())) {
                    friendStatus = "friends";
                } else if ("PENDING".equalsIgnoreCase(f.getStatus())) {
                    friendStatus = f.getSenderId().equals(currentUserId) ? "pending_sent" : "pending_received";
                }
            }
        }

        return UserProfileResponse.builder()
                .id(String.valueOf(profile.getUserId()))
                .username(profile.getUsername())
                .name(profile.getDisplayName())
                .avatarUrl(profile.getAvatarUrl())
                .bio(profile.getBio())
                .badge(profile.getBadge())
                .reputation(profile.getReputation())
                .followersCount(profile.getFollowersCount())
                .followingCount(profile.getFollowingCount())
                .ideasCount(profile.getIdeasCount())
                .isOnline(profile.getIsOnline())
                .isFriend("friends".equals(friendStatus))
                .friendStatus(friendStatus)
                .isFollowing(isFollowing)
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
