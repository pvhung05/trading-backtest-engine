package com.trading.community.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trading.community.model.CommunityGroup;

@Repository
public interface CommunityGroupRepository extends JpaRepository<CommunityGroup, Long> {

    Page<CommunityGroup> findByPrivacyOrderByMemberCountDesc(String privacy, Pageable pageable);

    @Query("SELECT g FROM CommunityGroup g WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<CommunityGroup> searchGroups(@Param("query") String query, Pageable pageable);

    List<CommunityGroup> findTop5ByOrderByMemberCountDesc();
}
