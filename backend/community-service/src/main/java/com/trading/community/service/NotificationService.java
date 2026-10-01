package com.trading.community.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trading.community.dto.NotificationResponse;
import com.trading.community.dto.UserDto;
import com.trading.community.model.Notification;
import com.trading.community.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void createNotification(Long recipientId, Long actorId, String actorName, String actorAvatar,
                                   String type, Long referenceId, String referenceType, String message) {
        if (recipientId == null || recipientId.equals(actorId)) {
            return; // don't notify oneself
        }

        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .actorId(actorId)
                .actorName(actorName)
                .actorAvatar(actorAvatar)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .message(message)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getRecipientId().equals(userId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        // Map backend type to frontend type if needed ('like' | 'comment' | 'friend_request' | 'friend_accept' | etc.)
        String frontendType = mapTypeToFrontend(n.getType());

        UserDto actor = UserDto.builder()
                .id(String.valueOf(n.getActorId()))
                .name(n.getActorName())
                .username("user" + n.getActorId())
                .avatarUrl(n.getActorAvatar())
                .build();

        return NotificationResponse.builder()
                .id(String.valueOf(n.getId()))
                .type(frontendType)
                .actor(actor)
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private String mapTypeToFrontend(String backendType) {
        if (backendType == null) return "like";
        return switch (backendType.toUpperCase()) {
            case "IDEA_LIKE", "POST_REACT" -> "like";
            case "IDEA_COMMENT", "POST_COMMENT" -> "comment";
            case "FRIEND_REQUEST" -> "friend_request";
            case "FRIEND_ACCEPT" -> "friend_accept";
            case "NEW_FOLLOWER" -> "mention";
            default -> backendType.toLowerCase();
        };
    }
}
