package com.trading.community.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.GroupMember;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserIdAndStatus(Long groupId, Long userId, String status);

    void deleteByGroupIdAndUserId(Long groupId, Long userId);

    Page<GroupMember> findByGroupIdAndStatus(Long groupId, String status, Pageable pageable);

    List<GroupMember> findByUserIdAndStatus(Long userId, String status);

    long countByGroupIdAndStatus(Long groupId, String status);
}
