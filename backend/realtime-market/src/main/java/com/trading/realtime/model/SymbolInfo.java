package com.trading.realtime.model;

/**
 * Represents trading symbol information fetched from Binance exchangeInfo.
 * This model holds static symbol metadata that is cached at application startup
 * and is used to provide frontend with available trading pairs.
 */
public record SymbolInfo(
		String symbol,
		String baseAsset,
		String quoteAsset,
		String status,
		String tradingPermission,
		String iceBergAllowed,
		String ocoAllowed
) {
}
