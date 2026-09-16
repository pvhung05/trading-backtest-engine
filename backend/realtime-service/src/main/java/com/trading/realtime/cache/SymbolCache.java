package com.trading.realtime.cache;

import com.trading.realtime.model.SymbolInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Thread-safe in-memory cache for symbol metadata.
 * Populated at application startup from Binance exchangeInfo API.
 * Contains static information about trading pairs and is never cleared during runtime.
 */
@Slf4j
@Component
public class SymbolCache {

	private final Map<String, SymbolInfo> cache = new ConcurrentHashMap<>();

	/**
	 * Stores a symbol's information in the cache.
	 *
	 * @param symbolInfo the symbol information to cache
	 */
	public void put(SymbolInfo symbolInfo) {
		if (symbolInfo != null && symbolInfo.symbol() != null) {
			cache.put(symbolInfo.symbol(), symbolInfo);
		}
	}

	/**
	 * Stores multiple symbols' information in the cache.
	 *
	 * @param symbols collection of symbol information to cache
	 */
	public void putAll(Collection<SymbolInfo> symbols) {
		if (symbols != null) {
			symbols.forEach(this::put);
		}
	}

	/**
	 * Retrieves symbol information by symbol name.
	 *
	 * @param symbol the symbol name
	 * @return Optional containing the symbol info if found
	 */
	public Optional<SymbolInfo> get(String symbol) {
		return Optional.ofNullable(cache.get(symbol));
	}

	/**
	 * Checks if a symbol exists in the cache.
	 *
	 * @param symbol the symbol name
	 * @return true if symbol exists
	 */
	public boolean contains(String symbol) {
		return cache.containsKey(symbol);
	}

	/**
	 * Returns all cached symbol information.
	 *
	 * @return collection of all symbol info
	 */
	public Collection<SymbolInfo> getAll() {
		return cache.values();
	}

	/**
	 * Returns all symbols that are currently trading (status = TRADING).
	 *
	 * @return collection of trading symbols
	 */
	public Collection<SymbolInfo> getTradingSymbols() {
		return cache.values().stream()
				.filter(si -> "TRADING".equalsIgnoreCase(si.status()))
				.collect(Collectors.toList());
	}

	/**
	 * Searches trading symbols matching query against symbol name, base asset, or quote asset.
	 *
	 * @param query search keyword
	 * @return collection of matching trading symbols
	 */
	public Collection<SymbolInfo> search(String query) {
		if (query == null || query.isBlank()) {
			return getTradingSymbols();
		}
		String q = query.trim().toUpperCase();
		return cache.values().stream()
				.filter(si -> "TRADING".equalsIgnoreCase(si.status()))
				.filter(si -> (si.symbol() != null && si.symbol().toUpperCase().contains(q))
						|| (si.baseAsset() != null && si.baseAsset().toUpperCase().contains(q))
						|| (si.quoteAsset() != null && si.quoteAsset().toUpperCase().contains(q)))
				.collect(Collectors.toList());
	}

	/**
	 * Returns all trading symbols with the specified quote asset (e.g. USDT, BTC, ETH).
	 *
	 * @param quoteAsset the quote asset name
	 * @return collection of matching trading symbols
	 */
	public Collection<SymbolInfo> getByQuoteAsset(String quoteAsset) {
		if (quoteAsset == null || quoteAsset.isBlank()) {
			return getTradingSymbols();
		}
		String qa = quoteAsset.trim().toUpperCase();
		return cache.values().stream()
				.filter(si -> "TRADING".equalsIgnoreCase(si.status()))
				.filter(si -> qa.equalsIgnoreCase(si.quoteAsset()))
				.collect(Collectors.toList());
	}

	/**
	 * Returns the count of cached symbols.
	 *
	 * @return number of symbols in cache
	 */
	public int size() {
		return cache.size();
	}

	/**
	 * Clears all symbols from the cache.
	 * Note: This is typically not used as symbol cache is permanent.
	 */
	public void clear() {
		cache.clear();
		log.info("Symbol cache cleared");
	}
}
