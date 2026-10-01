package com.trading.community.config;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.community.model.CommunityGroup;
import com.trading.community.model.GroupMember;
import com.trading.community.model.IdeaComment;
import com.trading.community.model.Post;
import com.trading.community.model.PostComment;
import com.trading.community.model.PostReaction;
import com.trading.community.model.TradingIdea;
import com.trading.community.model.UserProfile;
import com.trading.community.repository.CommunityGroupRepository;
import com.trading.community.repository.GroupMemberRepository;
import com.trading.community.repository.IdeaCommentRepository;
import com.trading.community.repository.PostCommentRepository;
import com.trading.community.repository.PostReactionRepository;
import com.trading.community.repository.PostRepository;
import com.trading.community.repository.TradingIdeaRepository;
import com.trading.community.repository.UserProfileRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final TradingIdeaRepository ideaRepository;
    private final IdeaCommentRepository ideaCommentRepository;
    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostReactionRepository postReactionRepository;
    private final CommunityGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.community.seed-data:true}")
    private boolean seedData;

    public DataInitializer(TradingIdeaRepository ideaRepository,
                           IdeaCommentRepository ideaCommentRepository,
                           PostRepository postRepository,
                           PostCommentRepository postCommentRepository,
                           PostReactionRepository postReactionRepository,
                           CommunityGroupRepository groupRepository,
                           GroupMemberRepository groupMemberRepository,
                           UserProfileRepository userProfileRepository,
                           ObjectMapper objectMapper) {
        this.ideaRepository = ideaRepository;
        this.ideaCommentRepository = ideaCommentRepository;
        this.postRepository = postRepository;
        this.postCommentRepository = postCommentRepository;
        this.postReactionRepository = postReactionRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userProfileRepository = userProfileRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!seedData || ideaRepository.count() > 0) {
            return;
        }

        // 1. Seed User Profiles
        UserProfile u1 = UserProfile.builder()
                .userId(1L)
                .username("sarah_macro")
                .displayName("Sarah Chen CFA")
                .avatarUrl("https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&auto=format")
                .bio("Senior Macro Analyst & CFA Charterholder. Focus on equities, tech sector, and macro liquidity trends.")
                .badge("PRO+")
                .reputation(24100)
                .followersCount(16500)
                .followingCount(120)
                .ideasCount(14)
                .isOnline(true)
                .build();
        userProfileRepository.save(u1);

        UserProfile u2 = UserProfile.builder()
                .userId(2L)
                .username("alex_trader")
                .displayName("Alexandre MarketWizard")
                .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&auto=format")
                .bio("Price Action & Order Flow specialist. Trading stocks, crypto, and commodity futures since 2017.")
                .badge("TOP AUTHOR")
                .reputation(15420)
                .followersCount(8940)
                .followingCount(85)
                .ideasCount(9)
                .isOnline(true)
                .build();
        userProfileRepository.save(u2);

        UserProfile u3 = UserProfile.builder()
                .userId(3L)
                .username("tuan_quant")
                .displayName("Alex Tuan Quant")
                .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&auto=format")
                .bio("Quantitative Developer & Algorithmic Trading Systems Engineer. ta4j & Python backtester.")
                .badge("QUANT DEV")
                .reputation(9240)
                .followersCount(4120)
                .followingCount(64)
                .ideasCount(6)
                .isOnline(true)
                .build();
        userProfileRepository.save(u3);

        UserProfile u4 = UserProfile.builder()
                .userId(4L)
                .username("david_orderflow")
                .displayName("David K. CryptoFlow")
                .avatarUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&auto=format")
                .bio("Crypto day trader focusing on volume footprint and market liquidity sweeps.")
                .badge("PRO")
                .reputation(7890)
                .followersCount(3200)
                .followingCount(40)
                .ideasCount(5)
                .isOnline(false)
                .build();
        userProfileRepository.save(u4);

        // 2. Seed Trading Ideas
        TradingIdea idea1 = TradingIdea.builder()
                .title("When Markets Hit Records, Should You Still Be Buying? Macro & Trend Review")
                .symbol("NASDAQ:IXIC")
                .assetClass("indices")
                .timeframe("1D")
                .direction("long")
                .entryPrice(new BigDecimal("20150.00"))
                .targetPrice(new BigDecimal("21500.00"))
                .stopLossPrice(new BigDecimal("19650.00"))
                .coverImage("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format")
                .summary("The Nasdaq NASDAQ:IXIC is back at record highs. The S&P 500 SPX and Dow have recently been there too. AI momentum and liquidity cycles suggest further expansion.")
                .content("""
## Nasdaq & S&P 500 Trend Analysis

The Nasdaq 100 and S&P 500 continue to reach new all-time highs driven by institutional inflows into tech and semiconductors.

### Key Technical Pillars:
1. **Trend Structure**: The 50-day SMA is sloping upward, acting as dynamic support for the Higher Highs & Higher Lows structure.
2. **RSI Indicator**: Oscillating in the 64-68 region without extreme overbought (>80), indicating buyers remain in control.
3. **Volume Profile**: Value Area High (VAH) successfully retested with immediate bounce.

> **Recommendation**: Maintain long positions, trailing stop loss along the recent swing low at 19,800.
""")
                .userId(1L)
                .authorName(u1.getDisplayName())
                .authorUsername(u1.getUsername())
                .authorAvatar(u1.getAvatarUrl())
                .authorBadge(u1.getBadge())
                .authorReputation(u1.getReputation())
                .likesCount(342)
                .commentsCount(2)
                .boostsCount(89)
                .viewsCount(4520)
                .tags("Nasdaq,Macro,TrendFollowing,AI-Rally")
                .isEditorsPick(true)
                .build();
        idea1 = ideaRepository.save(idea1);

        ideaCommentRepository.save(IdeaComment.builder()
                .ideaId(idea1.getId())
                .userId(3L)
                .authorName(u3.getDisplayName())
                .authorUsername(u3.getUsername())
                .authorAvatar(u3.getAvatarUrl())
                .authorBadge(u3.getBadge())
                .content("Spot on analysis! My SMA 20/50 algorithmic models on Nasdaq are giving solid continuation signals.")
                .likesCount(18)
                .build());

        ideaCommentRepository.save(IdeaComment.builder()
                .ideaId(idea1.getId())
                .userId(4L)
                .authorName(u4.getDisplayName())
                .authorUsername(u4.getUsername())
                .authorAvatar(u4.getAvatarUrl())
                .authorBadge(u4.getBadge())
                .content("Keep an eye on the upcoming FOMC meeting for potential short-term liquidity sweeps.")
                .likesCount(7)
                .build());

        TradingIdea idea2 = TradingIdea.builder()
                .title("$IGV / $NVDA: Potential Cup-with-Handle Pattern Formation & Breakout Target")
                .symbol("NASDAQ:NVDA")
                .assetClass("stocks")
                .timeframe("4h")
                .direction("long")
                .entryPrice(new BigDecimal("128.50"))
                .targetPrice(new BigDecimal("148.00"))
                .stopLossPrice(new BigDecimal("121.00"))
                .coverImage("https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&h=450&fit=crop&auto=format")
                .summary("NVDA and the IGV software sector ETF are finalizing the handle formation following a 3-month rounded cup base.")
                .content("""
## Cup & Handle Technical Breakdown

NVDA and the IGV software sector ETF are finalizing the handle formation following a 3-month rounded cup base.

### Setup Checklist:
- Base depth: ~22%, perfectly in line with high-performing growth stock cup bases.
- Handle volume: Significant drying up of volume during handle contraction, indicating lack of institutional selling pressure.
- Catalysts: Upcoming data center demand projections and next-gen chip architectures.
""")
                .userId(2L)
                .authorName(u2.getDisplayName())
                .authorUsername(u2.getUsername())
                .authorAvatar(u2.getAvatarUrl())
                .authorBadge(u2.getBadge())
                .authorReputation(u2.getReputation())
                .likesCount(215)
                .commentsCount(1)
                .boostsCount(45)
                .viewsCount(2980)
                .tags("NVIDIA,Semiconductors,Breakout,CupAndHandle")
                .isEditorsPick(true)
                .build();
        idea2 = ideaRepository.save(idea2);

        TradingIdea idea3 = TradingIdea.builder()
                .title("Bitcoin (BTC) Breakout Confirmation: Weekly Pennant Points to $108K")
                .symbol("BINANCE:BTCUSDT")
                .assetClass("crypto")
                .timeframe("1W")
                .direction("long")
                .entryPrice(new BigDecimal("67500.00"))
                .targetPrice(new BigDecimal("108000.00"))
                .stopLossPrice(new BigDecimal("59200.00"))
                .coverImage("https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&auto=format")
                .summary("Weekly close above the multi-month symmetrical triangle confirms the next impulsive wave. ETF net inflows remain strongly positive.")
                .content("""
## Bitcoin Macro Cycle Wave Analysis

Bitcoin has completed wave 4 consolidation and has initiated wave 5 higher.

### Key Factors:
- On-chain exchange balances at 5-year lows.
- Hash rate continuing to hit new peaks post-halving.
- Target derived from measuring flagpole height transposed onto breakout level at $68,000.
""")
                .userId(4L)
                .authorName(u4.getDisplayName())
                .authorUsername(u4.getUsername())
                .authorAvatar(u4.getAvatarUrl())
                .authorBadge(u4.getBadge())
                .authorReputation(u4.getReputation())
                .likesCount(528)
                .commentsCount(12)
                .boostsCount(142)
                .viewsCount(8740)
                .tags("Bitcoin,Crypto,BullMarket,Fibonacci")
                .isEditorsPick(false)
                .build();
        idea3 = ideaRepository.save(idea3);

        // 3. Seed Groups
        CommunityGroup g1 = CommunityGroup.builder()
                .name("Crypto Day Traders Vietnam")
                .description("Cộng đồng giao dịch phái sinh Crypto, chia sẻ kinh nghiệm Scalping, SMC & Price Action hàng ngày.")
                .coverUrl("https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=60")
                .privacy("public")
                .createdByUserId(1L)
                .memberCount(1420)
                .build();
        g1 = groupRepository.save(g1);

        CommunityGroup g2 = CommunityGroup.builder()
                .name("Algorithmic & Quantitative Trading")
                .description("Thảo luận về Backtest, Chiến lược định lượng, Python, ta4j, Machine Learning trong tài chính.")
                .coverUrl("https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60")
                .privacy("public")
                .createdByUserId(3L)
                .memberCount(856)
                .build();
        g2 = groupRepository.save(g2);

        // 4. Seed Social Posts
        Post p1 = Post.builder()
                .userId(3L)
                .authorName(u3.getDisplayName())
                .authorUsername(u3.getUsername())
                .authorAvatar(u3.getAvatarUrl())
                .content("Vừa hoàn thành phiên backtest chiến lược SuperTrend + EMA200 trên khung 1H cho BTC/USDT giai đoạn 2024-2026 🚀 Win rate đạt 58.4%, Profit Factor 2.15 và Max Drawdown chỉ 14.2%. Code hoàn toàn bằng Java & ta4j trên Trading Backtest Engine!\n\nMọi người nghĩ sao về việc kết hợp thêm bộ lọc RSI < 30 khi buy pullback?")
                .media(objectMapper.writeValueAsString(List.of(
                        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&h=400&fit=crop&auto=format"
                )))
                .privacy("public")
                .likesCount(47)
                .loveCount(23)
                .hahaCount(3)
                .wowCount(8)
                .sadCount(0)
                .angryCount(0)
                .commentCount(5)
                .shareCount(4)
                .build();
        p1 = postRepository.save(p1);

        postCommentRepository.save(PostComment.builder()
                .postId(p1.getId())
                .userId(2L)
                .authorName(u2.getDisplayName())
                .authorUsername(u2.getUsername())
                .authorAvatar(u2.getAvatarUrl())
                .content("Kết quả rất ấn tượng! Bạn có tính phí slippage và commission của sàn Binance vào chưa?")
                .likesCount(5)
                .build());

        Post p2 = Post.builder()
                .userId(1L)
                .authorName(u1.getDisplayName())
                .authorUsername(u1.getUsername())
                .authorAvatar(u1.getAvatarUrl())
                .content("Tuần này có tin tức Non-Farm Payrolls và CPI của Mỹ. Dự kiến biến động mạnh trên các cặp FX chính và Vàng (XAU/USD). Khuyến nghị anh em quản lý rủi ro chặt chẽ, giảm khối lượng lệnh xuống 50% trước giờ ra tin!")
                .media(objectMapper.writeValueAsString(List.of(
                        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=700&h=400&fit=crop&auto=format"
                )))
                .privacy("public")
                .likesCount(32)
                .loveCount(12)
                .hahaCount(1)
                .wowCount(4)
                .sadCount(0)
                .angryCount(0)
                .commentCount(2)
                .shareCount(1)
                .build();
        postRepository.save(p2);
    }
}
