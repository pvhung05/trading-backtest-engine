package com.trading.community.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trading.community.model.TradingIdea;

@Repository
public interface TradingIdeaRepository extends JpaRepository<TradingIdea, Long>, JpaSpecificationExecutor<TradingIdea> {

    Page<TradingIdea> findByAssetClassIgnoreCase(String assetClass, Pageable pageable);

    Page<TradingIdea> findBySymbolIgnoreCase(String symbol, Pageable pageable);

    Page<TradingIdea> findByIdIn(List<Long> ids, Pageable pageable);

    Page<TradingIdea> findByIsEditorsPickTrue(Pageable pageable);

    Page<TradingIdea> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT t FROM TradingIdea t WHERE " +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.symbol) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.authorName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.tags) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<TradingIdea> searchIdeas(@Param("query") String query, Pageable pageable);

    List<TradingIdea> findTop5BySymbolAndIdNotOrderByCreatedAtDesc(String symbol, Long id);

    List<TradingIdea> findTop5ByUserIdAndIdNotOrderByCreatedAtDesc(Long userId, Long id);
}
