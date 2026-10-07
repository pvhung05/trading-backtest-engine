-- ====================================================================
-- TRADING BACKTEST ENGINE - DATABASE SCHEMA DEFINITION (MySQL 8.0+)
-- Database: backtest_trading_system
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `backtest_trading_system`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `backtest_trading_system`;

-- --------------------------------------------------------------------
-- 1. Table: users (Quản lý tài khoản & phân quyền)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'USER',
    `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `uk_users_username` UNIQUE (`username`),
    CONSTRAINT `uk_users_email` UNIQUE (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: backtest_runs (Lưu thông tin các phiên chạy Backtest)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `backtest_runs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `strategy_type` VARCHAR(50) NOT NULL,
    `strategy_params` JSON NULL,
    `symbol` VARCHAR(20) NOT NULL,
    `timeframe` VARCHAR(10) NOT NULL,
    `start_time` TIMESTAMP NOT NULL,
    `end_time` TIMESTAMP NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    `execution_duration_ms` BIGINT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_backtest_runs_user_created` (`user_id`, `created_at` DESC),
    INDEX `idx_backtest_runs_symbol_tf` (`symbol`, `timeframe`),
    INDEX `idx_backtest_runs_strategy` (`strategy_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table: metrics_snapshots (Chỉ số thống kê hiệu suất Backtest)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `metrics_snapshots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `backtest_run_id` BIGINT NOT NULL UNIQUE,
    `initial_capital` DECIMAL(19, 4) NOT NULL,
    `final_balance` DECIMAL(19, 4) NOT NULL,
    `total_return_percent` DECIMAL(10, 4) NOT NULL,
    `total_trades` INT NOT NULL DEFAULT 0,
    `winning_trades` INT NOT NULL DEFAULT 0,
    `losing_trades` INT NOT NULL DEFAULT 0,
    `win_rate` DECIMAL(10, 4) NOT NULL,
    `profit_factor` DECIMAL(19, 4) NOT NULL,
    `average_win` DECIMAL(19, 4) NOT NULL,
    `average_loss` DECIMAL(19, 4) NOT NULL,
    `best_trade` DECIMAL(19, 4) NOT NULL,
    `worst_trade` DECIMAL(19, 4) NOT NULL,
    `max_consecutive_wins` INT NOT NULL DEFAULT 0,
    `max_consecutive_losses` INT NOT NULL DEFAULT 0,
    `expectancy` DECIMAL(19, 4) NOT NULL,
    `reward_risk_ratio` DECIMAL(19, 4) NOT NULL,
    `max_drawdown` DECIMAL(10, 4) NOT NULL,
    `recovery_factor` DECIMAL(19, 4) NOT NULL,
    `sharpe_ratio` DECIMAL(19, 4) NOT NULL,
    `sortino_ratio` DECIMAL(19, 4) NOT NULL,
    `calmar_ratio` DECIMAL(19, 4) NOT NULL,
    `cagr` DECIMAL(19, 4) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `fk_metrics_backtest_run`
        FOREIGN KEY (`backtest_run_id`) REFERENCES `backtest_runs` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Table: trade_records (Chi tiết từng lệnh giao dịch trong phiên)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trade_records` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `backtest_run_id` BIGINT NOT NULL,
    `trade_number` INT NOT NULL,
    `side` VARCHAR(10) NOT NULL,
    `entry_time` TIMESTAMP NOT NULL,
    `exit_time` TIMESTAMP NOT NULL,
    `entry_price` DECIMAL(19, 8) NOT NULL,
    `exit_price` DECIMAL(19, 8) NOT NULL,
    `quantity` DECIMAL(19, 8) NOT NULL,
    `gross_profit` DECIMAL(19, 8) NOT NULL,
    `commission` DECIMAL(19, 8) NOT NULL,
    `slippage_cost` DECIMAL(19, 8) NOT NULL,
    `net_profit` DECIMAL(19, 8) NOT NULL,
    `return_percent` DECIMAL(10, 4) NOT NULL,
    `holding_period_bars` INT NULL,
    `max_favorable_excursion` DECIMAL(19, 8) NULL,
    `max_adverse_excursion` DECIMAL(19, 8) NULL,
    `cumulative_pnl` DECIMAL(19, 4) NOT NULL,
    `size_usd` DECIMAL(19, 4) NOT NULL,
    `entry_signal` VARCHAR(100) NULL,
    `exit_signal` VARCHAR(100) NULL,

    INDEX `idx_trades_run_number` (`backtest_run_id`, `trade_number` ASC),
    CONSTRAINT `fk_trades_backtest_run`
        FOREIGN KEY (`backtest_run_id`) REFERENCES `backtest_runs` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Table: equity_points (Chuỗi thời gian giá trị vốn - Equity Curve)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equity_points` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `backtest_run_id` BIGINT NOT NULL,
    `timestamp` TIMESTAMP NOT NULL,
    `equity` DECIMAL(19, 4) NOT NULL,
    `cash` DECIMAL(19, 4) NOT NULL,
    `open_position_pnl` DECIMAL(19, 4) NULL,
    `trade_number` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_equity_run_timestamp` (`backtest_run_id`, `timestamp` ASC),
    CONSTRAINT `fk_equity_backtest_run`
        FOREIGN KEY (`backtest_run_id`) REFERENCES `backtest_runs` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- COMMUNITY SERVICE TABLES
-- ====================================================================

-- --------------------------------------------------------------------
-- 6. Table: community_user_profiles
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_user_profiles` (
    `user_id` BIGINT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `bio` TEXT NULL,
    `badge` VARCHAR(50) NULL,
    `reputation` INT NOT NULL DEFAULT 0,
    `followers_count` INT NOT NULL DEFAULT 0,
    `following_count` INT NOT NULL DEFAULT 0,
    `ideas_count` INT NOT NULL DEFAULT 0,
    `is_online` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `uk_community_profiles_username` UNIQUE (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. Table: community_trading_ideas
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_trading_ideas` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `symbol` VARCHAR(30) NOT NULL,
    `asset_class` VARCHAR(50) NOT NULL,
    `timeframe` VARCHAR(20) NOT NULL,
    `direction` VARCHAR(20) NOT NULL,
    `entry_price` DECIMAL(19, 8) NULL,
    `target_price` DECIMAL(19, 8) NULL,
    `stop_loss_price` DECIMAL(19, 8) NULL,
    `cover_image` TEXT NULL,
    `video_duration` VARCHAR(20) NULL,
    `summary` TEXT NULL,
    `content` LONGTEXT NULL,
    `backtest_run_id` BIGINT NULL,
    `user_id` BIGINT NOT NULL,
    `author_name` VARCHAR(100) NOT NULL,
    `author_username` VARCHAR(100) NOT NULL,
    `author_avatar` VARCHAR(500) NULL,
    `author_badge` VARCHAR(50) NULL,
    `author_reputation` INT NOT NULL DEFAULT 0,
    `likes_count` INT NOT NULL DEFAULT 0,
    `comments_count` INT NOT NULL DEFAULT 0,
    `boosts_count` INT NOT NULL DEFAULT 0,
    `views_count` INT NOT NULL DEFAULT 0,
    `tags` TEXT NULL,
    `is_editors_pick` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_ideas_user_id` (`user_id`),
    INDEX `idx_ideas_symbol` (`symbol`),
    INDEX `idx_ideas_asset_class` (`asset_class`),
    INDEX `idx_ideas_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. Table: community_idea_comments
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_idea_comments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `idea_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `author_name` VARCHAR(100) NOT NULL,
    `author_username` VARCHAR(100) NOT NULL,
    `author_avatar` VARCHAR(500) NULL,
    `author_badge` VARCHAR(50) NULL,
    `content` TEXT NOT NULL,
    `likes_count` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_idea_comments_idea_id` (`idea_id`),
    INDEX `idx_idea_comments_created_at` (`created_at` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_idea_comment_likes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `comment_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `uk_idea_comment_user_like` UNIQUE (`comment_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 9. Table: community_idea_likes, boosts, bookmarks
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_idea_likes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `idea_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `uk_idea_user_like` UNIQUE (`idea_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_idea_boosts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `idea_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `uk_idea_user_boost` UNIQUE (`idea_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_idea_bookmarks` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `idea_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `uk_idea_user_bookmark` UNIQUE (`idea_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 10. Table: community_posts
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_posts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `author_name` VARCHAR(100) NOT NULL,
    `author_username` VARCHAR(100) NOT NULL,
    `author_avatar` VARCHAR(500) NULL,
    `content` TEXT NOT NULL,
    `media` TEXT NULL,
    `privacy` VARCHAR(20) NOT NULL DEFAULT 'public',
    `group_id` BIGINT NULL,
    `likes_count` INT NOT NULL DEFAULT 0,
    `love_count` INT NOT NULL DEFAULT 0,
    `haha_count` INT NOT NULL DEFAULT 0,
    `wow_count` INT NOT NULL DEFAULT 0,
    `sad_count` INT NOT NULL DEFAULT 0,
    `angry_count` INT NOT NULL DEFAULT 0,
    `comment_count` INT NOT NULL DEFAULT 0,
    `share_count` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_posts_user_id` (`user_id`),
    INDEX `idx_posts_group_id` (`group_id`),
    INDEX `idx_posts_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 11. Table: community_post_reactions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_post_reactions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `post_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `reaction_type` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `uk_post_user_reaction` UNIQUE (`post_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 12. Table: community_post_comments & likes
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_post_comments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `post_id` BIGINT NOT NULL,
    `parent_id` BIGINT NULL,
    `user_id` BIGINT NOT NULL,
    `author_name` VARCHAR(100) NOT NULL,
    `author_username` VARCHAR(100) NOT NULL,
    `author_avatar` VARCHAR(500) NULL,
    `content` TEXT NOT NULL,
    `likes_count` INT NOT NULL DEFAULT 0,
    `reply_count` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_post_comments_post_id` (`post_id`),
    INDEX `idx_post_comments_parent_id` (`parent_id`),
    INDEX `idx_post_comments_created_at` (`created_at` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_post_comment_likes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `comment_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `uk_comment_user_like` UNIQUE (`comment_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 13. Table: community_friendships & follows
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_friendships` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `sender_id` BIGINT NOT NULL,
    `receiver_id` BIGINT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `uk_sender_receiver` UNIQUE (`sender_id`, `receiver_id`),
    INDEX `idx_friendship_sender` (`sender_id`),
    INDEX `idx_friendship_receiver` (`receiver_id`),
    INDEX `idx_friendship_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_follows` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `follower_id` BIGINT NOT NULL,
    `following_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `uk_follower_following` UNIQUE (`follower_id`, `following_id`),
    INDEX `idx_follows_follower` (`follower_id`),
    INDEX `idx_follows_following` (`following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 14. Table: community_groups & members
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_groups` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `cover_url` VARCHAR(500) NULL,
    `privacy` VARCHAR(20) NOT NULL DEFAULT 'public',
    `created_by_user_id` BIGINT NOT NULL,
    `member_count` INT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_group_members` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `group_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    `status` VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `uk_group_user_member` UNIQUE (`group_id`, `user_id`),
    INDEX `idx_group_members_group` (`group_id`),
    INDEX `idx_group_members_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 15. Table: community_notifications
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `recipient_id` BIGINT NOT NULL,
    `actor_id` BIGINT NOT NULL,
    `actor_name` VARCHAR(100) NOT NULL,
    `actor_avatar` VARCHAR(500) NULL,
    `type` VARCHAR(50) NOT NULL,
    `reference_id` BIGINT NULL,
    `reference_type` VARCHAR(50) NULL,
    `message` VARCHAR(500) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_notifications_recipient` (`recipient_id`),
    INDEX `idx_notifications_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

