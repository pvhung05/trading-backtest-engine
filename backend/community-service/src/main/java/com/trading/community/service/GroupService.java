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
import com.trading.community.dto.GroupResponse;
import com.trading.community.model.CommunityGroup;
import com.trading.community.model.GroupMember;
import com.trading.community.repository.CommunityGroupRepository;
import com.trading.community.repository.GroupMemberRepository;
import com.trading.community.security.SecurityUtils;
import com.trading.community.security.UserPrincipal;

@Service
public class GroupService {

    private final CommunityGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    public GroupService(CommunityGroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
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
    public GroupResponse joinGroup(Long groupId, UserPrincipal currentUser) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        Optional<GroupMember> existingOpt = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId());
        if (existingOpt.isEmpty()) {
            boolean isPrivate = "private".equalsIgnoreCase(group.getPrivacy());
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
