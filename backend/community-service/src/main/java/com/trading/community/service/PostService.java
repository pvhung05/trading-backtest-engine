package com.trading.community.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.community.dto.CreatePostRequest;
import com.trading.community.dto.PostCommentRequest;
import com.trading.community.dto.PostCommentResponse;
import com.trading.community.dto.PostResponse;
import com.trading.community.dto.UserDto;
import com.trading.community.model.Post;
import com.trading.community.model.PostComment;
import com.trading.community.model.PostCommentLike;
import com.trading.community.model.PostReaction;
import com.trading.community.model.UserProfile;
import com.trading.community.repository.FriendshipRepository;
import com.trading.community.repository.PostCommentLikeRepository;
import com.trading.community.repository.PostCommentRepository;
import com.trading.community.repository.PostReactionRepository;
import com.trading.community.repository.PostRepository;
import com.trading.community.repository.UserProfileRepository;
import com.trading.community.security.SecurityUtils;
import com.trading.community.security.UserPrincipal;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final PostReactionRepository reactionRepository;
    private final PostCommentRepository commentRepository;
    private final PostCommentLikeRepository commentLikeRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserProfileService userProfileService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public PostService(PostRepository postRepository,
                       PostReactionRepository reactionRepository,
                       PostCommentRepository commentRepository,
                       PostCommentLikeRepository commentLikeRepository,
                       FriendshipRepository friendshipRepository,
                       UserProfileService userProfileService,
                       NotificationService notificationService,
                       ObjectMapper objectMapper) {
        this.postRepository = postRepository;
        this.reactionRepository = reactionRepository;
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.friendshipRepository = friendshipRepository;
        this.userProfileService = userProfileService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(int page, int size) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);

        Page<Post> posts;
        if (currentUserId != null) {
            List<Long> friendIds = friendshipRepository.findFriendUserIds(currentUserId);
            if (friendIds.isEmpty()) {
                friendIds = List.of(-1L);
            }
            posts = postRepository.findFeedForUser(currentUserId, friendIds, pageable);
        } else {
            posts = postRepository.findPublicFeed(pageable);
        }

        return posts.map(post -> toResponse(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getUserPosts(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(post -> toResponse(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getGroupPosts(Long groupId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return postRepository.findByGroupIdOrderByCreatedAtDesc(groupId, pageable)
                .map(post -> toResponse(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + id));
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return toResponse(post, currentUserId);
    }

    @Transactional
    public PostResponse createPost(CreatePostRequest request, UserPrincipal user) {
        UserProfile profile = userProfileService.getOrCreateProfile(
                user.getId(), user.getUsername(), user.getUsername(), null);

        String mediaJson = null;
        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            try {
                mediaJson = objectMapper.writeValueAsString(request.getMedia());
            } catch (Exception e) {
                mediaJson = String.join(",", request.getMedia());
            }
        }

        Post post = Post.builder()
                .userId(user.getId())
                .authorName(profile.getDisplayName())
                .authorUsername(profile.getUsername())
                .authorAvatar(profile.getAvatarUrl())
                .content(request.getContent().trim())
                .media(mediaJson)
                .privacy(request.getPrivacy() != null ? request.getPrivacy().toLowerCase() : "public")
                .groupId(request.getGroupId())
                .build();

        Post saved = postRepository.save(post);
        return toResponse(saved, user.getId());
    }

    @Transactional
    public void deletePost(Long id, UserPrincipal user) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + id));

        if (!post.getUserId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not own this post");
        }

        postRepository.delete(post);
    }

    @Transactional
    public PostResponse reactToPost(Long postId, String reactionType, UserPrincipal user) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));

        String normalizedReaction = reactionType.toLowerCase().trim();
        Optional<PostReaction> existingOpt = reactionRepository.findByPostIdAndUserId(postId, user.getId());

        if (existingOpt.isPresent()) {
            PostReaction existing = existingOpt.get();
            // Decrement previous reaction count
            decrementReactionCount(post, existing.getReactionType());

            if (existing.getReactionType().equalsIgnoreCase(normalizedReaction)) {
                // Clicking same reaction toggles it off
                reactionRepository.delete(existing);
            } else {
                // Change reaction
                existing.setReactionType(normalizedReaction);
                reactionRepository.save(existing);
                incrementReactionCount(post, normalizedReaction);
            }
        } else {
            // New reaction
            PostReaction newReaction = PostReaction.builder()
                    .postId(postId)
                    .userId(user.getId())
                    .reactionType(normalizedReaction)
                    .build();
            reactionRepository.save(newReaction);
            incrementReactionCount(post, normalizedReaction);

            // Send notification
            notificationService.createNotification(
                    post.getUserId(),
                    user.getId(),
                    user.getUsername(),
                    null,
                    "POST_REACT",
                    post.getId(),
                    "POST",
                    user.getUsername() + " reacted to your post: " + normalizedReaction
            );
        }

        Post saved = postRepository.save(post);
        return toResponse(saved, user.getId());
    }

    @Transactional
    public PostCommentResponse addComment(Long postId, PostCommentRequest request, UserPrincipal user) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));

        UserProfile profile = userProfileService.getOrCreateProfile(
                user.getId(), user.getUsername(), user.getUsername(), null);

        PostComment comment = PostComment.builder()
                .postId(postId)
                .parentId(request.getParentId())
                .userId(user.getId())
                .authorName(profile.getDisplayName())
                .authorUsername(profile.getUsername())
                .authorAvatar(profile.getAvatarUrl())
                .content(request.getContent().trim())
                .likesCount(0)
                .replyCount(0)
                .build();

        PostComment saved = commentRepository.save(comment);

        // Update post comment count
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        // If it's a reply, increment parent's replyCount
        if (request.getParentId() != null) {
            commentRepository.findById(request.getParentId()).ifPresent(parent -> {
                parent.setReplyCount(parent.getReplyCount() + 1);
                commentRepository.save(parent);
            });
        }

        // Send notification
        notificationService.createNotification(
                post.getUserId(),
                user.getId(),
                profile.getDisplayName(),
                profile.getAvatarUrl(),
                "POST_COMMENT",
                post.getId(),
                "POST",
                profile.getDisplayName() + " commented on your post"
        );

        return toCommentResponse(saved, user.getId(), false);
    }

    @Transactional(readOnly = true)
    public List<PostCommentResponse> getComments(Long postId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        List<PostComment> rootComments = commentRepository.findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(postId);

        return rootComments.stream().map(c -> {
            PostCommentResponse resp = toCommentResponse(c, currentUserId, true);
            List<PostComment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(c.getId());
            resp.setReplies(replies.stream()
                    .map(r -> toCommentResponse(r, currentUserId, false))
                    .collect(Collectors.toList()));
            return resp;
        }).collect(Collectors.toList());
    }

    @Transactional
    public PostCommentResponse toggleCommentLike(Long commentId, UserPrincipal user) {
        PostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        boolean exists = commentLikeRepository.existsByCommentIdAndUserId(commentId, user.getId());
        if (exists) {
            commentLikeRepository.deleteByCommentIdAndUserId(commentId, user.getId());
            comment.setLikesCount(Math.max(0, comment.getLikesCount() - 1));
        } else {
            commentLikeRepository.save(PostCommentLike.builder().commentId(commentId).userId(user.getId()).build());
            comment.setLikesCount(comment.getLikesCount() + 1);
        }

        PostComment saved = commentRepository.save(comment);
        return toCommentResponse(saved, user.getId(), false);
    }

    private void incrementReactionCount(Post post, String type) {
        switch (type.toLowerCase()) {
            case "like" -> post.setLikesCount(post.getLikesCount() + 1);
            case "love" -> post.setLoveCount(post.getLoveCount() + 1);
            case "haha" -> post.setHahaCount(post.getHahaCount() + 1);
            case "wow" -> post.setWowCount(post.getWowCount() + 1);
            case "sad" -> post.setSadCount(post.getSadCount() + 1);
            case "angry" -> post.setAngryCount(post.getAngryCount() + 1);
        }
    }

    private void decrementReactionCount(Post post, String type) {
        switch (type.toLowerCase()) {
            case "like" -> post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
            case "love" -> post.setLoveCount(Math.max(0, post.getLoveCount() - 1));
            case "haha" -> post.setHahaCount(Math.max(0, post.getHahaCount() - 1));
            case "wow" -> post.setWowCount(Math.max(0, post.getWowCount() - 1));
            case "sad" -> post.setSadCount(Math.max(0, post.getSadCount() - 1));
            case "angry" -> post.setAngryCount(Math.max(0, post.getAngryCount() - 1));
        }
    }

    public PostResponse toResponse(Post post, Long currentUserId) {
        List<String> mediaList = Collections.emptyList();
        if (post.getMedia() != null && !post.getMedia().isBlank()) {
            try {
                mediaList = objectMapper.readValue(post.getMedia(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                mediaList = Arrays.stream(post.getMedia().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());
            }
        }

        Map<String, Integer> reactions = new HashMap<>();
        reactions.put("like", post.getLikesCount() != null ? post.getLikesCount() : 0);
        reactions.put("love", post.getLoveCount() != null ? post.getLoveCount() : 0);
        reactions.put("haha", post.getHahaCount() != null ? post.getHahaCount() : 0);
        reactions.put("wow", post.getWowCount() != null ? post.getWowCount() : 0);
        reactions.put("sad", post.getSadCount() != null ? post.getSadCount() : 0);
        reactions.put("angry", post.getAngryCount() != null ? post.getAngryCount() : 0);

        int totalReactions = reactions.values().stream().mapToInt(Integer::intValue).sum();

        String userReaction = null;
        if (currentUserId != null) {
            userReaction = reactionRepository.findByPostIdAndUserId(post.getId(), currentUserId)
                    .map(PostReaction::getReactionType)
                    .orElse(null);
        }

        UserDto author = UserDto.builder()
                .id(String.valueOf(post.getUserId()))
                .name(post.getAuthorName())
                .username(post.getAuthorUsername())
                .avatarUrl(post.getAuthorAvatar())
                .build();

        return PostResponse.builder()
                .id(String.valueOf(post.getId()))
                .author(author)
                .content(post.getContent())
                .media(mediaList)
                .privacy(post.getPrivacy())
                .groupId(post.getGroupId())
                .reactions(reactions)
                .userReaction(userReaction)
                .totalReactions(totalReactions)
                .commentCount(post.getCommentCount())
                .shareCount(post.getShareCount())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private PostCommentResponse toCommentResponse(PostComment comment, Long currentUserId, boolean includeReplies) {
        boolean hasLiked = false;
        if (currentUserId != null) {
            hasLiked = commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), currentUserId);
        }

        UserDto author = UserDto.builder()
                .id(String.valueOf(comment.getUserId()))
                .name(comment.getAuthorName())
                .username(comment.getAuthorUsername())
                .avatarUrl(comment.getAuthorAvatar())
                .build();

        return PostCommentResponse.builder()
                .id(String.valueOf(comment.getId()))
                .postId(comment.getPostId())
                .parentId(comment.getParentId())
                .author(author)
                .content(comment.getContent())
                .likes(comment.getLikesCount())
                .hasLiked(hasLiked)
                .replyCount(comment.getReplyCount())
                .replies(includeReplies ? new ArrayList<>() : null)
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
