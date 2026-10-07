package com.trading.community.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateIdeaRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Symbol is required")
    private String symbol;

    @NotBlank(message = "Asset class is required")
    private String assetClass; // crypto, stocks, forex, indices, strategies

    private String timeframe; // 4h, 1D, 1W

    @NotBlank(message = "Direction is required")
    private String direction; // long, short, neutral

    private BigDecimal entryPrice;
    private BigDecimal targetPrice;
    private BigDecimal stopLossPrice;

    private String coverImage;
    private String videoDuration;
    private String summary;
    private String content;

    private Long backtestRunId;

    private List<String> tags;
}
