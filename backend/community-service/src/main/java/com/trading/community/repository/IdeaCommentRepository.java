package com.trading.community.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.IdeaComment;

@Repository
public interface IdeaCommentRepository extends JpaRepository<IdeaComment, Long> {

    List<IdeaComment> findByIdeaIdOrderByCreatedAtAsc(Long ideaId);

    Page<IdeaComment> findByIdeaIdOrderByCreatedAtDesc(Long ideaId, Pageable pageable);

    long countByIdeaId(Long ideaId);
}
