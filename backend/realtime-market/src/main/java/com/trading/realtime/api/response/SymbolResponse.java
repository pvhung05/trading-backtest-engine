package com.trading.realtime.api.response;

import lombok.Builder;
import lombok.Data;

/**
 * Response DTO for symbol information.
 * Exposed via /api/market/symbols endpoint.
 */
@Data
@Builder
public class SymbolResponse {
	private String symbol;
	private String baseAsset;
	private String quoteAsset;
	private String status;
}
