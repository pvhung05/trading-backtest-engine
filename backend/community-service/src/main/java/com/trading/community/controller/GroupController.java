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
import com.trading.community.dto.CreateGroupRequest;
import com.trading.community.dto.GroupMemberResponse;
import com.trading.community.dto.GroupResponse;
import com.trading.community.dto.UpdateGroupRequest;
import com.trading.community.security.UserPrincipal;
import com.trading.community.service.GroupService;

@RestController
@RequestMapping("/api/community/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<GroupResponse>>> getGroups(
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {
        Page<GroupResponse> groups = groupService.getGroups(query, page, size);
        return ResponseEntity.ok(ApiResponse.ok(groups));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupResponse>> getGroupById(@PathVariable Long id) {
        GroupResponse group = groupService.getGroupById(id);
        return ResponseEntity.ok(ApiResponse.ok(group));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GroupResponse>> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        GroupResponse group = groupService.createGroup(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Group created successfully", group));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupResponse>> updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGroupRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        GroupResponse group = groupService.updateGroup(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Group updated successfully", group));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        groupService.deleteGroup(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Group deleted successfully", null));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<GroupResponse>> joinGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        GroupResponse group = groupService.joinGroup(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Group joined", group));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<GroupResponse>> leaveGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        GroupResponse group = groupService.leaveGroup(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Left group", group));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<GroupResponse>>> getMyGroups(
            @AuthenticationPrincipal UserPrincipal user) {
        List<GroupResponse> groups = groupService.getUserGroups(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(groups));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<GroupMemberResponse>>> getGroupMembers(
            @PathVariable Long id,
            @RequestParam(required = false) String status) {
        List<GroupMemberResponse> members = groupService.getGroupMembers(id, status);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    @GetMapping("/{id}/members/pending")
    public ResponseEntity<ApiResponse<List<GroupMemberResponse>>> getPendingMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        List<GroupMemberResponse> members = groupService.getPendingMembers(id, user);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    @PostMapping("/{id}/members/{targetUserId}/respond")
    public ResponseEntity<ApiResponse<GroupMemberResponse>> respondMemberRequest(
            @PathVariable Long id,
            @PathVariable Long targetUserId,
            @RequestParam boolean approve,
            @AuthenticationPrincipal UserPrincipal user) {
        GroupMemberResponse response = groupService.respondMemberRequest(id, targetUserId, approve, user);
        String msg = approve ? "Member request approved" : "Member request declined";
        return ResponseEntity.ok(ApiResponse.ok(msg, response));
    }

    @DeleteMapping("/{id}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long id,
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal user) {
        groupService.removeMember(id, targetUserId, user);
        return ResponseEntity.ok(ApiResponse.ok("Member removed from group", null));
    }

    @PostMapping("/{id}/members/{targetUserId}/promote")
    public ResponseEntity<ApiResponse<GroupMemberResponse>> promoteMember(
            @PathVariable Long id,
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal user) {
        GroupMemberResponse response = groupService.promoteMember(id, targetUserId, user);
        return ResponseEntity.ok(ApiResponse.ok("Member promoted to admin", response));
    }
}
