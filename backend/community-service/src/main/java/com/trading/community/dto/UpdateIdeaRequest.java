package com.trading.community.dto;

import java.math.BigDecimal;
import java.util.List;

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
public class UpdateIdeaRequest {

    private String title;
    private String timeframe;
    private String direction;
    private BigDecimal entryPrice;
    private BigDecimal targetPrice;
    private BigDecimal stopLossPrice;
    private String coverImage;
    private String summary;
    private String content;
    private List<String> tags;
}
