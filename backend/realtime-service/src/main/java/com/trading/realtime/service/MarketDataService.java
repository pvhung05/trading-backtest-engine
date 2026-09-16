package com.trading.realtime.service;

import com.trading.realtime.model.ChartSubscription;
import com.trading.realtime.model.Kline;
import com.trading.realtime.model.MarketTicker;
import com.trading.realtime.model.SymbolInfo;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for managing market data operations.
 * Defines contracts for data access, caching, streaming, and lifecycle management.
 */
public interface MarketDataService {

	/**
	 * Retrieves all trading symbols.
	 *
	 * @return list of symbol information
	 */
	List<SymbolInfo> getAllSymbols();

	/**
	 * Searches trading symbols by symbol name, base asset, or quote asset.
	 *
	 * @param query keyword to search
	 * @return list of matching symbols
	 */
	List<SymbolInfo> searchSymbols(String query);

	/**
	 * Retrieves all trading symbols for a specific quote asset (e.g. USDT, BTC).
	 *
	 * @param quoteAsset the quote asset
	 * @return list of matching symbols
	 */
	List<SymbolInfo> getSymbolsByQuoteAsset(String quoteAsset);

	/**
	 * Retrieves symbol information by symbol name.
	 *
	 * @param symbol the symbol name
	 * @return Optional containing symbol info if found
	 */
	Optional<SymbolInfo> getSymbol(String symbol);

	/**
	 * Retrieves all market tickers.
	 *
	 * @return list of market tickers
	 */
	List<MarketTicker> getAllTickers();

	/**
	 * Retrieves market tickers sorted by quote volume descending (watchlist order).
	 *
	 * @return list of sorted market tickers
	 */
	List<MarketTicker> getWatchlistTickers();

	/**
	 * Retrieves top market tickers by quote volume up to a limit.
	 *
	 * @param limit maximum number of tickers to return
	 * @return list of top market tickers
	 */
	List<MarketTicker> getTopTickers(int limit);

	/**
	 * Retrieves market tickers filtered by quote asset and sorted by quote volume descending.
	 *
	 * @param quoteAsset quote asset to filter by (e.g. USDT, BTC)
	 * @return list of filtered market tickers
	 */
	List<MarketTicker> getTickersByQuoteAsset(String quoteAsset);

	/**
	 * Clears the market tickers watchlist cache.
	 */
	void clearWatchlistCache();

	/**
	 * Retrieves a ticker for a specific symbol.
	 *
	 * @param symbol the symbol name
	 * @return Optional containing ticker if found
	 */
	Optional<MarketTicker> getTicker(String symbol);

	/**
	 * Fetches historical kline data from Binance REST API.
	 *
	 * @param symbol    the trading symbol
	 * @param interval  the candlestick interval
	 * @param limit     maximum number of candles
	 * @param startTime optional start time in milliseconds
	 * @param endTime   optional end time in milliseconds
	 * @return list of klines
	 */
	List<Kline> fetchKlines(String symbol, String interval, Integer limit, Long startTime, Long endTime);

	/**
	 * Subscribes to real-time chart updates for a symbol and interval.
	 *
	 * @param symbol    the trading symbol
	 * @param interval  the candlestick interval
	 * @param sessionId the frontend WebSocket session ID
	 * @return the chart subscription
	 */
	ChartSubscription subscribeToChart(String symbol, String interval, String sessionId);

	/**
	 * Unsubscribes from real-time chart updates.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 */
	void unsubscribeFromChart(String symbol, String interval);

	/**
	 * Retrieves the current chart subscription state.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return Optional containing the subscription if exists
	 */
	Optional<ChartSubscription> getChartSubscription(String symbol, String interval);

	/**
	 * Returns the latest candle for a chart subscription.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return Optional containing the latest candle
	 */
	Optional<Kline> getLatestCandle(String symbol, String interval);

	/**
	 * Returns the count of cached symbols.
	 *
	 * @return number of symbols in cache
	 */
	int getSymbolCount();

	/**
	 * Returns the count of cached tickers.
	 *
	 * @return number of tickers in cache
	 */
	int getTickerCount();

	/**
	 * Returns the count of active chart subscriptions.
	 *
	 * @return number of subscriptions in cache
	 */
	int getSubscriptionCount();

	/**
	 * Checks if the primary WebSocket connection (ticker stream) is active.
	 *
	 * @return true if ticker stream WebSocket is connected and open
	 */
	boolean isWebSocketActive();
}
