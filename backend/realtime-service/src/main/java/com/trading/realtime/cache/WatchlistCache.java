package com.trading.realtime.cache;

import com.trading.realtime.model.MarketTicker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Thread-safe in-memory cache for 24-hour market tickers.
 * Updated continuously via Binance !ticker@arr WebSocket stream.
 * Used to provide real-time watchlist data to the frontend.
 */
@Slf4j
@Component
public class WatchlistCache {

	private final Map<String, MarketTicker> cache = new ConcurrentHashMap<>();

	/**
	 * Updates the ticker for a specific symbol.
	 * Called whenever a new ticker update arrives from the WebSocket stream.
	 *
	 * @param ticker the updated market ticker
	 */
	public void update(MarketTicker ticker) {
		if (ticker != null && ticker.getSymbol() != null) {
			cache.put(ticker.getSymbol(), ticker);
		}
	}

	/**
	 * Updates multiple tickers at once.
	 * Typically called when processing the !ticker@arr stream which contains all symbols.
	 *
	 * @param tickers collection of market tickers to update
	 */
	public void updateAll(Collection<MarketTicker> tickers) {
		if (tickers != null) {
			for (MarketTicker ticker : tickers) {
				update(ticker);
			}
			log.debug("Updated {} tickers in watchlist cache", tickers.size());
		}
	}

	/**
	 * Retrieves the ticker for a specific symbol.
	 *
	 * @param symbol the symbol name
	 * @return Optional containing the ticker if found
	 */
	public Optional<MarketTicker> get(String symbol) {
		return Optional.ofNullable(cache.get(symbol));
	}

	/**
	 * Checks if a symbol's ticker exists in the cache.
	 *
	 * @param symbol the symbol name
	 * @return true if ticker exists
	 */
	public boolean contains(String symbol) {
		return cache.containsKey(symbol);
	}

	/**
	 * Returns all cached market tickers.
	 *
	 * @return collection of all market tickers
	 */
	public Collection<MarketTicker> getAll() {
		return cache.values();
	}

	/**
	 * Returns all tickers sorted by quote volume (descending).
	 * Useful for displaying top trading pairs.
	 *
	 * @return sorted collection of market tickers
	 */
	public Collection<MarketTicker> getTopByVolume() {
		return cache.values().stream()
				.filter(t -> t.getQuoteVolume() != null)
				.sorted((a, b) -> {
					try {
						double volA = Double.parseDouble(a.getQuoteVolume());
						double volB = Double.parseDouble(b.getQuoteVolume());
						return Double.compare(volB, volA);
					} catch (NumberFormatException e) {
						return 0;
					}
				})
				.collect(Collectors.toList());
	}

	/**
	 * Returns the count of cached tickers.
	 *
	 * @return number of tickers in cache
	 */
	public int size() {
		return cache.size();
	}

	/**
	 * Clears all tickers from the cache.
	 */
	public void clear() {
		cache.clear();
		log.info("Watchlist cache cleared");
	}
}
