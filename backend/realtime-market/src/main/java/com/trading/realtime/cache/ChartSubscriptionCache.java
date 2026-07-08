package com.trading.realtime.cache;

import com.trading.realtime.model.ChartSubscription;
import com.trading.realtime.model.Kline;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory cache for chart subscriptions.
 * Each entry represents a unique symbol+interval combination that has an active
 * WebSocket connection to Binance kline stream. Multiple frontend clients can
 * share the same subscription (subscriberCount > 1).
 */
@Slf4j
@Component
public class ChartSubscriptionCache {

	private final Map<String, ChartSubscription> cache = new ConcurrentHashMap<>();

	/**
	 * Generates the cache key for a symbol and interval combination.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return the cache key in format SYMBOL_INTERVAL
	 */
	public String buildKey(String symbol, String interval) {
		return (symbol + "_" + interval).toUpperCase();
	}

	/**
	 * Creates or updates a subscription for a symbol+interval.
	 * If the subscription already exists, increments the subscriber count.
	 *
	 * @param symbol     the trading symbol
	 * @param interval   the candlestick interval
	 * @param wsSessionId the WebSocket session ID handling this subscription
	 * @return the subscription entry
	 */
	public ChartSubscription subscribe(String symbol, String interval, String wsSessionId) {
		String key = buildKey(symbol, interval);
		long now = System.currentTimeMillis();

		return cache.compute(key, (k, existing) -> {
			if (existing != null) {
				existing.setSubscriberCount(existing.getSubscriberCount() + 1);
				existing.setLastAccessTime(now);
				if (wsSessionId != null) {
					existing.setWsSessionId(wsSessionId);
				}
				log.debug("Incremented subscriber count for {} to {}", key, existing.getSubscriberCount());
				return existing;
			} else {
				log.info("Created new chart subscription for {}", key);
				return ChartSubscription.builder()
						.symbol(symbol.toUpperCase())
						.interval(interval)
						.subscriberCount(1)
						.lastAccessTime(now)
						.wsSessionId(wsSessionId)
						.build();
			}
		});
	}

	/**
	 * Decrements the subscriber count for a subscription.
	 * The subscription remains in cache until auto-cleanup removes it.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 */
	public void unsubscribe(String symbol, String interval) {
		String key = buildKey(symbol, interval);
		cache.computeIfPresent(key, (k, existing) -> {
			existing.setSubscriberCount(Math.max(0, existing.getSubscriberCount() - 1));
			existing.setLastAccessTime(System.currentTimeMillis());
			if (existing.getSubscriberCount() == 0) {
				log.info("Subscription {} has no more subscribers", key);
			} else {
				log.debug("Decremented subscriber count for {} to {}", key, existing.getSubscriberCount());
			}
			return existing;
		});
	}

	/**
	 * Updates the latest candle for a subscription.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @param kline    the latest candle data
	 */
	public void updateCandle(String symbol, String interval, Kline kline) {
		String key = buildKey(symbol, interval);
		cache.computeIfPresent(key, (k, existing) -> {
			existing.setLatestCandle(kline);
			existing.setLastAccessTime(System.currentTimeMillis());
			return existing;
		});
	}

	/**
	 * Retrieves a subscription by symbol and interval.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return Optional containing the subscription if found
	 */
	public Optional<ChartSubscription> get(String symbol, String interval) {
		return Optional.ofNullable(cache.get(buildKey(symbol, interval)));
	}

	/**
	 * Checks if a subscription exists.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return true if subscription exists
	 */
	public boolean hasSubscription(String symbol, String interval) {
		return cache.containsKey(buildKey(symbol, interval));
	}

	/**
	 * Returns all active subscriptions.
	 *
	 * @return collection of all chart subscriptions
	 */
	public Collection<ChartSubscription> getAll() {
		return cache.values();
	}

	/**
	 * Returns all subscriptions that have no active subscribers.
	 *
	 * @return collection of inactive subscriptions
	 */
	public Collection<ChartSubscription> getInactiveSubscriptions() {
		return cache.values().stream()
				.filter(s -> s.getSubscriberCount() == 0)
				.toList();
	}

	/**
	 * Removes a subscription from the cache.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return the removed subscription, if any
	 */
	public ChartSubscription remove(String symbol, String interval) {
		String key = buildKey(symbol, interval);
		ChartSubscription removed = cache.remove(key);
		if (removed != null) {
			log.info("Removed chart subscription for {}", key);
		}
		return removed;
	}

	/**
	 * Returns the count of cached subscriptions.
	 *
	 * @return number of subscriptions in cache
	 */
	public int size() {
		return cache.size();
	}

	/**
	 * Clears all subscriptions from the cache.
	 */
	public void clear() {
		cache.clear();
		log.info("Chart subscription cache cleared");
	}
}
