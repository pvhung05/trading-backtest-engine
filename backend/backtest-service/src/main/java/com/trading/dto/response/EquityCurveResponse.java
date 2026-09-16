package com.trading.dto.response;

import java.util.List;

/**
 * The full equity curve produced by the portfolio simulation.
 */
public record EquityCurveResponse(
        List<EquityCurvePointResponse> points
) {
}
