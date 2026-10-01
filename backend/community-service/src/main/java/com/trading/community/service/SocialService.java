package com.trading.community.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trading.community.dto.FriendshipResponse;
import com.trading.community.dto.UserDto;
import com.trading.community.model.Follow;
import com.trading.community.model.Friendship;
import com.trading.community.model.UserProfile;
import com.trading.community.repository.FollowRepository;
import com.trading.community.repository.FriendshipRepository;
import com.trading.community.repository.UserProfileRepository;
import com.trading.community.security.UserPrincipal;

@Service
public class SocialService {

    private final FriendshipRepository friendshipRepository;
    private final FollowRepository followRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileService userProfileService;
    private final NotificationService notificationService;

    public SocialService(FriendshipRepository friendshipRepository,
                         FollowRepository followRepository,
                         UserProfileRepository userProfileRepository,
                         UserProfileService userProfileService,
                         NotificationService notificationService) {
        this.friendshipRepository = friendshipRepository;
        this.followRepository = followRepository;
        this.userProfileRepository = userProfileRepository;
        this.userProfileService = userProfileService;
        this.notificationService = notificationService;
    }

    @Transactional
    public FriendshipResponse sendFriendRequest(Long targetUserId, UserPrincipal currentUser) {
        if (targetUserId.equals(currentUser.getId())) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        UserProfile targetProfile = userProfileRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        UserProfile myProfile = userProfileService.getOrCreateProfile(
                currentUser.getId(), currentUser.getUsername(), currentUser.getUsername(), null);

        Optional<Friendship> existingOpt = friendshipRepository.findBetweenUsers(currentUser.getId(), targetUserId);

        Friendship friendship;
        if (existingOpt.isPresent()) {
            friendship = existingOpt.get();
            if ("ACCEPTED".equalsIgnoreCase(friendship.getStatus())) {
                return buildFriendshipResponse(friendship, currentUser.getId(), targetProfile);
            }
            if ("REJECTED".equalsIgnoreCase(friendship.getStatus())) {
                friendship.setStatus("PENDING");
                friendship.setSenderId(currentUser.getId());
                friendship.setReceiverId(targetUserId);
                friendship = friendshipRepository.save(friendship);
            }
        } else {
            friendship = Friendship.builder()
                    .senderId(currentUser.getId())
                    .receiverId(targetUserId)
                    .status("PENDING")
                    .build();
            friendship = friendshipRepository.save(friendship);
        }

        notificationService.createNotification(
                targetUserId,
                currentUser.getId(),
                myProfile.getDisplayName(),
                myProfile.getAvatarUrl(),
                "FRIEND_REQUEST",
                friendship.getId(),
                "USER",
                myProfile.getDisplayName() + " sent you a friend request"
        );

        return buildFriendshipResponse(friendship, currentUser.getId(), targetProfile);
    }

    @Transactional
    public FriendshipResponse respondFriendRequest(Long friendshipId, boolean accept, UserPrincipal currentUser) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found: " + friendshipId));

        if (!friendship.getReceiverId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to respond to this request");
        }

        UserProfile senderProfile = userProfileRepository.findById(friendship.getSenderId())
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        UserProfile myProfile = userProfileService.getOrCreateProfile(
                currentUser.getId(), currentUser.getUsername(), currentUser.getUsername(), null);

        if (accept) {
            friendship.setStatus("ACCEPTED");
            friendship = friendshipRepository.save(friendship);

            notificationService.createNotification(
                    friendship.getSenderId(),
                    currentUser.getId(),
                    myProfile.getDisplayName(),
                    myProfile.getAvatarUrl(),
                    "FRIEND_ACCEPT",
                    friendship.getId(),
                    "USER",
                    myProfile.getDisplayName() + " accepted your friend request"
            );
        } else {
            friendship.setStatus("REJECTED");
            friendship = friendshipRepository.save(friendship);
        }

        return buildFriendshipResponse(friendship, currentUser.getId(), senderProfile);
    }

    @Transactional
    public void removeFriend(Long targetUserId, UserPrincipal currentUser) {
        friendshipRepository.findBetweenUsers(currentUser.getId(), targetUserId)
                .ifPresent(friendshipRepository::delete);
    }

    @Transactional(readOnly = true)
    public Page<FriendshipResponse> getFriends(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return friendshipRepository.findAcceptedFriendships(userId, pageable)
                .map(f -> {
                    Long otherUserId = f.getSenderId().equals(userId) ? f.getReceiverId() : f.getSenderId();
                    UserProfile otherProfile = userProfileRepository.findById(otherUserId).orElse(null);
                    return buildFriendshipResponse(f, userId, otherProfile);
                });
    }

    @Transactional(readOnly = true)
    public Page<FriendshipResponse> getPendingRequests(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return friendshipRepository.findByReceiverIdAndStatus(userId, "PENDING", pageable)
                .map(f -> {
                    UserProfile sender = userProfileRepository.findById(f.getSenderId()).orElse(null);
                    return buildFriendshipResponse(f, userId, sender);
                });
    }

    @Transactional
    public boolean followUser(Long targetUserId, UserPrincipal currentUser) {
        if (targetUserId.equals(currentUser.getId())) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        UserProfile targetProfile = userProfileRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));
        UserProfile myProfile = userProfileService.getOrCreateProfile(
                currentUser.getId(), currentUser.getUsername(), currentUser.getUsername(), null);

        if (!followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), targetUserId)) {
            followRepository.save(Follow.builder()
                    .followerId(currentUser.getId())
                    .followingId(targetUserId)
                    .build());

            // Increment target's followersCount
            targetProfile.setFollowersCount(targetProfile.getFollowersCount() + 1);
            userProfileRepository.save(targetProfile);

            // Increment my followingCount
            myProfile.setFollowingCount(myProfile.getFollowingCount() + 1);
            userProfileRepository.save(myProfile);

            // Notification
            notificationService.createNotification(
                    targetUserId,
                    currentUser.getId(),
                    myProfile.getDisplayName(),
                    myProfile.getAvatarUrl(),
                    "NEW_FOLLOWER",
                    currentUser.getId(),
                    "USER",
                    myProfile.getDisplayName() + " started following you"
            );
            return true;
        }
        return false;
    }

    @Transactional
    public boolean unfollowUser(Long targetUserId, UserPrincipal currentUser) {
        if (followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), targetUserId)) {
            followRepository.deleteByFollowerIdAndFollowingId(currentUser.getId(), targetUserId);

            userProfileRepository.findById(targetUserId).ifPresent(p -> {
                p.setFollowersCount(Math.max(0, p.getFollowersCount() - 1));
                userProfileRepository.save(p);
            });

            userProfileRepository.findById(currentUser.getId()).ifPresent(p -> {
                p.setFollowingCount(Math.max(0, p.getFollowingCount() - 1));
                userProfileRepository.save(p);
            });
            return true;
        }
        return false;
    }

    private FriendshipResponse buildFriendshipResponse(Friendship f, Long currentUserId, UserProfile otherProfile) {
        String status = "not_friend";
        if ("ACCEPTED".equalsIgnoreCase(f.getStatus())) {
            status = "friends";
        } else if ("PENDING".equalsIgnoreCase(f.getStatus())) {
            status = f.getSenderId().equals(currentUserId) ? "pending_sent" : "pending_received";
        }

        UserDto userDto = null;
        if (otherProfile != null) {
            userDto = userProfileService.toUserDto(otherProfile);
        }

        return FriendshipResponse.builder()
                .id(String.valueOf(f.getId()))
                .user(userDto)
                .status(status)
                .createdAt(f.getCreatedAt())
                .build();
    }
}
