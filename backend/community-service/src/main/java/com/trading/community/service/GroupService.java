package com.trading.community.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trading.community.dto.CreateGroupRequest;
import com.trading.community.dto.GroupMemberResponse;
import com.trading.community.dto.GroupResponse;
import com.trading.community.dto.UpdateGroupRequest;
import com.trading.community.dto.UserDto;
import com.trading.community.model.CommunityGroup;
import com.trading.community.model.GroupMember;
import com.trading.community.model.UserProfile;
import com.trading.community.repository.CommunityGroupRepository;
import com.trading.community.repository.GroupMemberRepository;
import com.trading.community.repository.UserProfileRepository;
import com.trading.community.security.SecurityUtils;
import com.trading.community.security.UserPrincipal;

@Service
public class GroupService {

    private final CommunityGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileService userProfileService;
    private final NotificationService notificationService;

    public GroupService(CommunityGroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        UserProfileRepository userProfileRepository,
                        UserProfileService userProfileService,
                        NotificationService notificationService) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userProfileRepository = userProfileRepository;
        this.userProfileService = userProfileService;
        this.notificationService = notificationService;
    }

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request, UserPrincipal currentUser) {
        CommunityGroup group = CommunityGroup.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .coverUrl(request.getCoverUrl() != null ? request.getCoverUrl() : "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60")
                .privacy(request.getPrivacy() != null ? request.getPrivacy().toLowerCase() : "public")
                .createdByUserId(currentUser.getId())
                .memberCount(1)
                .build();

        CommunityGroup saved = groupRepository.save(group);

        GroupMember adminMember = GroupMember.builder()
                .groupId(saved.getId())
                .userId(currentUser.getId())
                .role("ADMIN")
                .status("APPROVED")
                .build();
        groupMemberRepository.save(adminMember);

        return toResponse(saved, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public Page<GroupResponse> getGroups(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CommunityGroup> groups;
        if (query != null && !query.trim().isEmpty()) {
            groups = groupRepository.searchGroups(query.trim(), pageable);
        } else {
            groups = groupRepository.findAll(pageable);
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        return groups.map(g -> toResponse(g, currentUserId));
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroupById(Long id) {
        CommunityGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + id));
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return toResponse(group, currentUserId);
    }

    @Transactional
    public GroupResponse updateGroup(Long groupId, UpdateGroupRequest request, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        verifyGroupAdmin(group, currentUser.getId());

        if (request.getName() != null && !request.getName().isBlank()) {
            group.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription().trim());
        }
        if (request.getCoverUrl() != null) {
            group.setCoverUrl(request.getCoverUrl().trim());
        }
        if (request.getPrivacy() != null) {
            group.setPrivacy(request.getPrivacy().toLowerCase().trim());
        }

        CommunityGroup saved = groupRepository.save(group);
        return toResponse(saved, currentUser.getId());
    }

    @Transactional
    public void deleteGroup(Long groupId, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        if (!group.getCreatedByUserId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Only group creator can delete the group");
        }

        List<GroupMember> members = groupMemberRepository.findByGroupIdOrderByJoinedAtAsc(groupId);
        groupMemberRepository.deleteAll(members);
        groupRepository.delete(group);
    }

    @Transactional
    public GroupResponse joinGroup(Long groupId, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        UserProfile myProfile = userProfileService.getOrCreateProfile(
                currentUser.getId(), currentUser.getUsername(), currentUser.getUsername(), null);

        Optional<GroupMember> existingOpt = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId());
        boolean isPrivate = "private".equalsIgnoreCase(group.getPrivacy());

        if (existingOpt.isEmpty()) {
            GroupMember member = GroupMember.builder()
                    .groupId(groupId)
                    .userId(currentUser.getId())
                    .role("MEMBER")
                    .status(isPrivate ? "PENDING" : "APPROVED")
                    .build();
            groupMemberRepository.save(member);

            if (!isPrivate) {
                group.setMemberCount(group.getMemberCount() + 1);
                groupRepository.save(group);

                // Notify group creator (UML Activity 5.2)
                notificationService.createNotification(
                        group.getCreatedByUserId(),
                        currentUser.getId(),
                        myProfile.getDisplayName(),
                        myProfile.getAvatarUrl(),
                        "GROUP_JOIN",
                        group.getId(),
                        "GROUP",
                        myProfile.getDisplayName() + " joined your group " + group.getName()
                );
            } else {
                // Private group: notify creator/admins to review
                notificationService.createNotification(
                        group.getCreatedByUserId(),
                        currentUser.getId(),
                        myProfile.getDisplayName(),
                        myProfile.getAvatarUrl(),
                        "GROUP_JOIN_REQUEST",
                        group.getId(),
                        "GROUP",
                        myProfile.getDisplayName() + " requested to join your group " + group.getName()
                );
            }
        } else {
            GroupMember existing = existingOpt.get();
            if ("REJECTED".equalsIgnoreCase(existing.getStatus())) {
                existing.setStatus(isPrivate ? "PENDING" : "APPROVED");
                groupMemberRepository.save(existing);
                if (!isPrivate) {
                    group.setMemberCount(group.getMemberCount() + 1);
                    groupRepository.save(group);
                }
            }
        }

        return toResponse(group, currentUser.getId());
    }

    @Transactional
    public GroupResponse leaveGroup(Long groupId, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId()).ifPresent(m -> {
            groupMemberRepository.delete(m);
            if ("APPROVED".equalsIgnoreCase(m.getStatus())) {
                group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
                groupRepository.save(group);
            }
        });

        return toResponse(group, currentUser.getId());
    }

    @Transactional
    public GroupMemberResponse respondMemberRequest(Long groupId, Long targetUserId, boolean approve, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        verifyGroupAdmin(group, currentUser.getId());

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member request not found"));

        UserProfile targetProfile = userProfileRepository.findById(targetUserId).orElse(null);

        if (approve) {
            member.setStatus("APPROVED");
            groupMemberRepository.save(member);

            group.setMemberCount(group.getMemberCount() + 1);
            groupRepository.save(group);

            notificationService.createNotification(
                    targetUserId,
                    currentUser.getId(),
                    group.getName(),
                    group.getCoverUrl(),
                    "GROUP_JOIN_APPROVED",
                    group.getId(),
                    "GROUP",
                    "Your request to join " + group.getName() + " has been approved"
            );
        } else {
            member.setStatus("REJECTED");
            groupMemberRepository.save(member);

            notificationService.createNotification(
                    targetUserId,
                    currentUser.getId(),
                    group.getName(),
                    group.getCoverUrl(),
                    "GROUP_JOIN_REJECTED",
                    group.getId(),
                    "GROUP",
                    "Your request to join " + group.getName() + " was declined"
            );
        }

        return toMemberResponse(member, targetProfile);
    }

    @Transactional
    public void removeMember(Long groupId, Long targetUserId, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        verifyGroupAdmin(group, currentUser.getId());

        if (targetUserId.equals(group.getCreatedByUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot remove group owner");
        }

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in group"));

        groupMemberRepository.delete(member);

        if ("APPROVED".equalsIgnoreCase(member.getStatus())) {
            group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
            groupRepository.save(group);
        }

        notificationService.createNotification(
                targetUserId,
                currentUser.getId(),
                group.getName(),
                group.getCoverUrl(),
                "GROUP_MEMBER_REMOVED",
                group.getId(),
                "GROUP",
                "You have been removed from " + group.getName()
        );
    }

    @Transactional
    public GroupMemberResponse promoteMember(Long groupId, Long targetUserId, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        verifyGroupAdmin(group, currentUser.getId());

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in group"));

        member.setRole("ADMIN");
        GroupMember saved = groupMemberRepository.save(member);

        UserProfile targetProfile = userProfileRepository.findById(targetUserId).orElse(null);

        notificationService.createNotification(
                targetUserId,
                currentUser.getId(),
                group.getName(),
                group.getCoverUrl(),
                "GROUP_ADMIN_PROMOTED",
                group.getId(),
                "GROUP",
                "You have been promoted to Admin in " + group.getName()
        );

        return toMemberResponse(saved, targetProfile);
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getGroupMembers(Long groupId, String status) {
        List<GroupMember> members;
        if (status != null && !status.isBlank()) {
            members = groupMemberRepository.findByGroupIdAndStatusOrderByJoinedAtAsc(groupId, status.toUpperCase());
        } else {
            members = groupMemberRepository.findByGroupIdOrderByJoinedAtAsc(groupId);
        }

        return members.stream().map(m -> {
            UserProfile profile = userProfileRepository.findById(m.getUserId()).orElse(null);
            return toMemberResponse(m, profile);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getPendingMembers(Long groupId, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        verifyGroupAdmin(group, currentUser.getId());

        return getGroupMembers(groupId, "PENDING");
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getUserGroups(Long userId) {
        List<GroupMember> members = groupMemberRepository.findByUserIdAndStatus(userId, "APPROVED");
        return members.stream()
                .map(m -> groupRepository.findById(m.getGroupId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(g -> toResponse(g, userId))
                .collect(Collectors.toList());
    }

    private void verifyGroupAdmin(CommunityGroup group, Long userId) {
        boolean isOwner = group.getCreatedByUserId().equals(userId);
        boolean isAdmin = groupMemberRepository.existsByGroupIdAndUserIdAndRole(group.getId(), userId, "ADMIN");
        if (!isOwner && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Group admin privileges required");
        }
    }

    private GroupMemberResponse toMemberResponse(GroupMember m, UserProfile profile) {
        UserDto userDto = null;
        if (profile != null) {
            userDto = userProfileService.toUserDto(profile);
        } else {
            userDto = UserDto.builder()
                    .id(String.valueOf(m.getUserId()))
                    .name("User #" + m.getUserId())
                    .username("user" + m.getUserId())
                    .build();
        }

        return GroupMemberResponse.builder()
                .id(String.valueOf(m.getId()))
                .groupId(m.getGroupId())
                .user(userDto)
                .role(m.getRole())
                .status(m.getStatus())
                .joinedAt(m.getJoinedAt())
                .build();
    }

    private GroupResponse toResponse(CommunityGroup g, Long currentUserId) {
        boolean isMember = false;
        boolean isPendingApproval = false;
        String role = null;

        if (currentUserId != null) {
            var memberOpt = groupMemberRepository.findByGroupIdAndUserId(g.getId(), currentUserId);
            if (memberOpt.isPresent()) {
                var m = memberOpt.get();
                isMember = "APPROVED".equalsIgnoreCase(m.getStatus());
                isPendingApproval = "PENDING".equalsIgnoreCase(m.getStatus());
                role = m.getRole();
            }
        }

        return GroupResponse.builder()
                .id(String.valueOf(g.getId()))
                .name(g.getName())
                .description(g.getDescription())
                .coverUrl(g.getCoverUrl())
                .privacy(g.getPrivacy())
                .memberCount(g.getMemberCount())
                .isMember(isMember)
                .isPendingApproval(isPendingApproval)
                .role(role)
                .createdAt(g.getCreatedAt())
                .build();
    }
}
