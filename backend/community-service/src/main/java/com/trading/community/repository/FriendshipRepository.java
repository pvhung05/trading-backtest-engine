package com.trading.community.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trading.community.model.Friendship;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    @Query("SELECT f FROM Friendship f WHERE (f.senderId = :u1 AND f.receiverId = :u2) OR (f.senderId = :u2 AND f.receiverId = :u1)")
    Optional<Friendship> findBetweenUsers(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT CASE WHEN f.senderId = :userId THEN f.receiverId ELSE f.senderId END FROM Friendship f " +
           "WHERE (f.senderId = :userId OR f.receiverId = :userId) AND f.status = 'ACCEPTED'")
    List<Long> findFriendUserIds(@Param("userId") Long userId);

    @Query("SELECT f FROM Friendship f WHERE (f.senderId = :userId OR f.receiverId = :userId) AND f.status = 'ACCEPTED'")
    Page<Friendship> findAcceptedFriendships(@Param("userId") Long userId, Pageable pageable);

    // Pending friend requests received by user
    Page<Friendship> findByReceiverIdAndStatus(Long receiverId, String status, Pageable pageable);

    // Pending friend requests sent by user
    Page<Friendship> findBySenderIdAndStatus(Long senderId, String status, Pageable pageable);

    long countByReceiverIdAndStatus(Long receiverId, String status);
}
