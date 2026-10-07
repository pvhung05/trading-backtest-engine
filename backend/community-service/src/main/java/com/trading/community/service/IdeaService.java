package com.trading.community.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trading.community.dto.AuthorDto;
import com.trading.community.dto.CreateIdeaRequest;
import com.trading.community.dto.IdeaCommentRequest;
import com.trading.community.dto.IdeaCommentResponse;
import com.trading.community.dto.TradingIdeaResponse;
import com.trading.community.dto.UpdateIdeaRequest;
import com.trading.community.model.IdeaBookmark;
import com.trading.community.model.IdeaBoost;
import com.trading.community.model.IdeaComment;
import com.trading.community.model.IdeaCommentLike;
import com.trading.community.model.IdeaLike;
import com.trading.community.model.TradingIdea;
import com.trading.community.model.UserProfile;
import com.trading.community.repository.FollowRepository;
import com.trading.community.repository.IdeaBookmarkRepository;
import com.trading.community.repository.IdeaBoostRepository;
import com.trading.community.repository.IdeaCommentLikeRepository;
import com.trading.community.repository.IdeaCommentRepository;
import com.trading.community.repository.IdeaLikeRepository;
import com.trading.community.repository.TradingIdeaRepository;
import com.trading.community.repository.UserProfileRepository;
import com.trading.community.security.SecurityUtils;
import com.trading.community.security.UserPrincipal;

@Service
public class IdeaService {

    private final TradingIdeaRepository ideaRepository;
    private final IdeaCommentRepository commentRepository;
    private final IdeaLikeRepository likeRepository;
    private final IdeaBoostRepository boostRepository;
    private final IdeaBookmarkRepository bookmarkRepository;
    private final FollowRepository followRepository;
    private final UserProfileService userProfileService;
    private final UserProfileRepository userProfileRepository;
    private final IdeaCommentLikeRepository commentLikeRepository;
    private final NotificationService notificationService;

    public IdeaService(TradingIdeaRepository ideaRepository,
                       IdeaCommentRepository commentRepository,
                       IdeaLikeRepository likeRepository,
                       IdeaBoostRepository boostRepository,
                       IdeaBookmarkRepository bookmarkRepository,
                       IdeaCommentLikeRepository commentLikeRepository,
                       FollowRepository followRepository,
                       UserProfileService userProfileService,
                       UserProfileRepository userProfileRepository,
                       NotificationService notificationService) {
        this.ideaRepository = ideaRepository;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
        this.boostRepository = boostRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.followRepository = followRepository;
        this.userProfileService = userProfileService;
        this.userProfileRepository = userProfileRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Page<TradingIdeaResponse> getIdeas(String category, String query, String sort, int page, int size) {
        Sort sortObj = switch (sort != null ? sort.toLowerCase() : "popular") {
            case "trending" -> Sort.by(Sort.Direction.DESC, "viewsCount", "createdAt");
            case "recent" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "editors_picks" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "likesCount", "createdAt");
        };

        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<TradingIdea> ideas;

        if (query != null && !query.trim().isEmpty()) {
            ideas = ideaRepository.searchIdeas(query.trim(), pageable);
        } else if ("editors_picks".equalsIgnoreCase(sort)) {
            ideas = ideaRepository.findByIsEditorsPickTrue(pageable);
        } else if (category != null && !category.trim().isEmpty() && !"all".equalsIgnoreCase(category)) {
            ideas = ideaRepository.findByAssetClassIgnoreCase(category.trim(), pageable);
        } else {
            ideas = ideaRepository.findAll(pageable);
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ideas.map(idea -> toResponse(idea, currentUserId));
    }

    @Transactional
    public TradingIdeaResponse getIdeaById(Long id) {
        TradingIdea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trading idea not found: " + id));

        // Increment views
        idea.setViewsCount(idea.getViewsCount() + 1);
        ideaRepository.save(idea);

        Long currentUserId = SecurityUtils.getCurrentUserId();
        return toResponse(idea, currentUserId);
    }

    @Transactional
    public TradingIdeaResponse createIdea(CreateIdeaRequest request, UserPrincipal user) {
        UserProfile profile = userProfileService.getOrCreateProfile(
                user.getId(), user.getUsername(), user.getUsername(), null);

        String tagsString = null;
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            tagsString = String.join(",", request.getTags());
        }

        TradingIdea idea = TradingIdea.builder()
                .title(request.getTitle())
                .symbol(request.getSymbol().toUpperCase())
                .assetClass(request.getAssetClass().toLowerCase())
                .timeframe(request.getTimeframe() != null ? request.getTimeframe() : "1D")
                .direction(request.getDirection().toLowerCase())
                .entryPrice(request.getEntryPrice())
                .targetPrice(request.getTargetPrice())
                .stopLossPrice(request.getStopLossPrice())
                .coverImage(request.getCoverImage())
                .videoDuration(request.getVideoDuration())
                .summary(request.getSummary())
                .content(request.getContent())
                .backtestRunId(request.getBacktestRunId())
                .userId(user.getId())
                .authorName(profile.getDisplayName())
                .authorUsername(profile.getUsername())
                .authorAvatar(profile.getAvatarUrl())
                .authorBadge(profile.getBadge())
                .authorReputation(profile.getReputation())
                .tags(tagsString)
                .isEditorsPick(false)
                .build();

        TradingIdea saved = ideaRepository.save(idea);

        // Increment user's idea count
        profile.setIdeasCount(profile.getIdeasCount() + 1);
        userProfileRepository.save(profile);

        return toResponse(saved, user.getId());
    }

    @Transactional
    public TradingIdeaResponse updateIdea(Long id, UpdateIdeaRequest request, UserPrincipal user) {
        TradingIdea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trading idea not found: " + id));

        if (!idea.getUserId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not own this trading idea");
        }

        if (request.getTitle() != null) idea.setTitle(request.getTitle());
        if (request.getTimeframe() != null) idea.setTimeframe(request.getTimeframe());
        if (request.getDirection() != null) idea.setDirection(request.getDirection().toLowerCase());
        if (request.getEntryPrice() != null) idea.setEntryPrice(request.getEntryPrice());
        if (request.getTargetPrice() != null) idea.setTargetPrice(request.getTargetPrice());
        if (request.getStopLossPrice() != null) idea.setStopLossPrice(request.getStopLossPrice());
        if (request.getCoverImage() != null) idea.setCoverImage(request.getCoverImage());
        if (request.getSummary() != null) idea.setSummary(request.getSummary());
        if (request.getContent() != null) idea.setContent(request.getContent());
        if (request.getBacktestRunId() != null) idea.setBacktestRunId(request.getBacktestRunId());
        if (request.getTags() != null) {
            idea.setTags(String.join(",", request.getTags()));
        }

        TradingIdea saved = ideaRepository.save(idea);
        return toResponse(saved, user.getId());
    }

    @Transactional
    public void deleteIdea(Long id, UserPrincipal user) {
        TradingIdea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trading idea not found: " + id));

        if (!idea.getUserId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not own this trading idea");
        }

        ideaRepository.delete(idea);

        userProfileRepository.findById(user.getId()).ifPresent(p -> {
            p.setIdeasCount(Math.max(0, p.getIdeasCount() - 1));
            userProfileRepository.save(p);
        });
    }

    @Transactional
    public TradingIdeaResponse toggleLikeIdea(Long id, UserPrincipal user) {
        TradingIdea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trading idea not found: " + id));

        boolean exists = likeRepository.existsByIdeaIdAndUserId(id, user.getId());
        if (exists) {
            likeRepository.deleteByIdeaIdAndUserId(id, user.getId());
            idea.setLikesCount(Math.max(0, idea.getLikesCount() - 1));
        } else {
            likeRepository.save(IdeaLike.builder().ideaId(id).userId(user.getId()).build());
            idea.setLikesCount(idea.getLikesCount() + 1);

            // Send notification
            notificationService.createNotification(
                    idea.getUserId(),
                    user.getId(),
                    user.getUsername(),
                    null,
                    "IDEA_LIKE",
                    idea.getId(),
                    "IDEA",
                    user.getUsername() + " liked your trading idea: " + idea.getTitle()
            );
        }

        TradingIdea saved = ideaRepository.save(idea);
        return toResponse(saved, user.getId());
    }

    @Transactional
    public TradingIdeaResponse boostIdea(Long id, UserPrincipal user) {
        TradingIdea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trading idea not found: " + id));

        if (!boostRepository.existsByIdeaIdAndUserId(id, user.getId())) {
            boostRepository.save(IdeaBoost.builder().ideaId(id).userId(user.getId()).build());
            idea.setBoostsCount(idea.getBoostsCount() + 1);
            ideaRepository.save(idea);
        }

        return toResponse(idea, user.getId());
    }

    @Transactional
    public TradingIdeaResponse toggleBookmark(Long id, UserPrincipal user) {
        TradingIdea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trading idea not found: " + id));

        if (bookmarkRepository.existsByIdeaIdAndUserId(id, user.getId())) {
            bookmarkRepository.deleteByIdeaIdAndUserId(id, user.getId());
        } else {
            bookmarkRepository.save(IdeaBookmark.builder().ideaId(id).userId(user.getId()).build());
        }

        return toResponse(idea, user.getId());
    }

    @Transactional
    public IdeaCommentResponse addComment(Long id, IdeaCommentRequest request, UserPrincipal user) {
        TradingIdea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trading idea not found: " + id));

        UserProfile profile = userProfileService.getOrCreateProfile(
                user.getId(), user.getUsername(), user.getUsername(), null);

        IdeaComment comment = IdeaComment.builder()
                .ideaId(id)
                .userId(user.getId())
                .authorName(profile.getDisplayName())
                .authorUsername(profile.getUsername())
                .authorAvatar(profile.getAvatarUrl())
                .authorBadge(profile.getBadge())
                .content(request.getContent().trim())
                .likesCount(0)
                .build();

        IdeaComment saved = commentRepository.save(comment);

        // Update comment count on idea
        idea.setCommentsCount(idea.getCommentsCount() + 1);
        ideaRepository.save(idea);

        // Notify author
        notificationService.createNotification(
                idea.getUserId(),
                user.getId(),
                profile.getDisplayName(),
                profile.getAvatarUrl(),
                "IDEA_COMMENT",
                idea.getId(),
                "IDEA",
                profile.getDisplayName() + " commented on your idea: " + idea.getTitle()
        );

        return toCommentResponse(saved, user.getId());
    }

    @Transactional(readOnly = true)
    public List<IdeaCommentResponse> getComments(Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return commentRepository.findByIdeaIdOrderByCreatedAtAsc(id)
                .stream()
                .map(c -> toCommentResponse(c, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long ideaId, Long commentId, UserPrincipal user) {
        IdeaComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        if (!comment.getIdeaId().equals(ideaId)) {
            throw new IllegalArgumentException("Comment does not belong to this idea");
        }

        TradingIdea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new IllegalArgumentException("Idea not found: " + ideaId));

        // Only comment author or idea author can delete
        if (!comment.getUserId().equals(user.getId()) && !idea.getUserId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to delete this comment");
        }

        commentLikeRepository.deleteByCommentId(commentId);
        commentRepository.delete(comment);

        idea.setCommentsCount(Math.max(0, idea.getCommentsCount() - 1));
        ideaRepository.save(idea);
    }

    @Transactional
    public IdeaCommentResponse toggleCommentLike(Long commentId, UserPrincipal user) {
        IdeaComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        boolean exists = commentLikeRepository.existsByCommentIdAndUserId(commentId, user.getId());
        if (exists) {
            commentLikeRepository.deleteByCommentIdAndUserId(commentId, user.getId());
            comment.setLikesCount(Math.max(0, comment.getLikesCount() - 1));
        } else {
            commentLikeRepository.save(IdeaCommentLike.builder().commentId(commentId).userId(user.getId()).build());
            comment.setLikesCount(comment.getLikesCount() + 1);

            UserProfile profile = userProfileService.getOrCreateProfile(
                    user.getId(), user.getUsername(), user.getUsername(), null);

            notificationService.createNotification(
                    comment.getUserId(),
                    user.getId(),
                    profile.getDisplayName(),
                    profile.getAvatarUrl(),
                    "IDEA_COMMENT_LIKE",
                    comment.getIdeaId(),
                    "IDEA",
                    profile.getDisplayName() + " liked your comment"
            );
        }

        IdeaComment saved = commentRepository.save(comment);
        return toCommentResponse(saved, user.getId());
    }

    @Transactional(readOnly = true)
    public Page<TradingIdeaResponse> getBookmarkedIdeas(int page, int size, UserPrincipal user) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<IdeaBookmark> bookmarks = bookmarkRepository.findByUserId(user.getId(), pageable);
        List<Long> ideaIds = bookmarks.getContent().stream()
                .map(IdeaBookmark::getIdeaId)
                .collect(Collectors.toList());

        if (ideaIds.isEmpty()) {
            return Page.empty(pageable);
        }

        Page<TradingIdea> ideas = ideaRepository.findByIdIn(ideaIds, pageable);
        return ideas.map(i -> toResponse(i, user.getId()));
    }

    @Transactional(readOnly = true)
    public Page<TradingIdeaResponse> getIdeasBySymbol(String symbol, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<TradingIdea> ideas = ideaRepository.findBySymbolIgnoreCase(symbol.trim(), pageable);
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ideas.map(i -> toResponse(i, currentUserId));
    }

    @Transactional(readOnly = true)
    public List<TradingIdeaResponse> getRelatedIdeas(Long ideaId) {
        TradingIdea idea = ideaRepository.findById(ideaId).orElse(null);
        if (idea == null) return Collections.emptyList();

        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ideaRepository.findTop5BySymbolAndIdNotOrderByCreatedAtDesc(idea.getSymbol(), ideaId)
                .stream()
                .map(i -> toResponse(i, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TradingIdeaResponse> getAuthorIdeas(Long authorUserId, Long currentIdeaId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ideaRepository.findTop5ByUserIdAndIdNotOrderByCreatedAtDesc(authorUserId, currentIdeaId)
                .stream()
                .map(i -> toResponse(i, currentUserId))
                .collect(Collectors.toList());
    }

    public TradingIdeaResponse toResponse(TradingIdea idea, Long currentUserId) {
        List<String> tags = Collections.emptyList();
        if (idea.getTags() != null && !idea.getTags().isBlank()) {
            tags = Arrays.stream(idea.getTags().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        boolean hasLiked = false;
        boolean hasBoosted = false;
        boolean hasBookmarked = false;
        boolean isFollowing = false;

        if (currentUserId != null) {
            hasLiked = likeRepository.existsByIdeaIdAndUserId(idea.getId(), currentUserId);
            hasBoosted = boostRepository.existsByIdeaIdAndUserId(idea.getId(), currentUserId);
            hasBookmarked = bookmarkRepository.existsByIdeaIdAndUserId(idea.getId(), currentUserId);
            if (!currentUserId.equals(idea.getUserId())) {
                isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUserId, idea.getUserId());
            }
        }

        AuthorDto author = AuthorDto.builder()
                .id(String.valueOf(idea.getUserId()))
                .name(idea.getAuthorName())
                .username(idea.getAuthorUsername())
                .avatarUrl(idea.getAuthorAvatar())
                .badge(idea.getAuthorBadge())
                .reputation(idea.getAuthorReputation())
                .build();

        return TradingIdeaResponse.builder()
                .id(String.valueOf(idea.getId()))
                .title(idea.getTitle())
                .symbol(idea.getSymbol())
                .assetClass(idea.getAssetClass())
                .timeframe(idea.getTimeframe())
                .direction(idea.getDirection())
                .entryPrice(idea.getEntryPrice())
                .targetPrice(idea.getTargetPrice())
                .stopLossPrice(idea.getStopLossPrice())
                .coverImage(idea.getCoverImage())
                .videoDuration(idea.getVideoDuration())
                .summary(idea.getSummary())
                .content(idea.getContent())
                .backtestRunId(idea.getBacktestRunId())
                .author(author)
                .likes(idea.getLikesCount())
                .comments(idea.getCommentsCount())
                .boosts(idea.getBoostsCount())
                .views(idea.getViewsCount())
                .tags(tags)
                .isEditorsPick(idea.getIsEditorsPick())
                .createdAt(idea.getCreatedAt())
                .hasLiked(hasLiked)
                .hasBoosted(hasBoosted)
                .hasBookmarked(hasBookmarked)
                .isFollowingAuthor(isFollowing)
                .build();
    }

    private IdeaCommentResponse toCommentResponse(IdeaComment comment, Long currentUserId) {
        boolean hasLiked = false;
        if (currentUserId != null) {
            hasLiked = commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), currentUserId);
        }

        AuthorDto author = AuthorDto.builder()
                .id(String.valueOf(comment.getUserId()))
                .name(comment.getAuthorName())
                .username(comment.getAuthorUsername())
                .avatarUrl(comment.getAuthorAvatar())
                .badge(comment.getAuthorBadge())
                .build();

        return IdeaCommentResponse.builder()
                .id(String.valueOf(comment.getId()))
                .ideaId(comment.getIdeaId())
                .author(author)
                .content(comment.getContent())
                .likes(comment.getLikesCount())
                .hasLiked(hasLiked)
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
