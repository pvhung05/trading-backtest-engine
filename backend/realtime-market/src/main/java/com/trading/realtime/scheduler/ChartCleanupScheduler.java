package com.trading.realtime.scheduler;

import com.trading.realtime.cache.ChartSubscriptionCache;
import com.trading.realtime.client.websocket.BinanceWebSocketManager;
import com.trading.realtime.model.ChartSubscription;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * Scheduler for managing chart subscription lifecycle.
 * Runs periodic cleanup of inactive subscriptions and WebSocket connections.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChartCleanupScheduler {

	private final ChartSubscriptionCache chartSubscriptionCache;
	private final BinanceWebSocketManager webSocketManager;

	@Value("${cache.stale-threshold-minutes:10}")
	private int staleThresholdMinutes;

	/**
	 * Runs every minute to clean up inactive chart subscriptions.
	 * Removes subscriptions that have no subscribers and haven't been accessed
	 * for longer than the stale threshold (default: 10 minutes).
	 */
	@Scheduled(fixedRateString = "${cache.cleanup.interval-ms:60000}")
	public void cleanupInactiveSubscriptions() {
		log.debug("Running chart subscription cleanup...");

		Collection<ChartSubscription> inactiveSubscriptions = chartSubscriptionCache.getInactiveSubscriptions();
		int cleaned = 0;

		for (ChartSubscription subscription : inactiveSubscriptions) {
			long inactiveMinutes = (System.currentTimeMillis() - subscription.getLastAccessTime()) / 60000;

			if (inactiveMinutes >= staleThresholdMinutes) {
				log.info("Cleaning up stale subscription: {} {} (inactive for {} minutes)",
						subscription.getSymbol(), subscription.getInterval(), inactiveMinutes);

				chartSubscriptionCache.remove(subscription.getSymbol(), subscription.getInterval());
				webSocketManager.unsubscribeKline(subscription.getSymbol(), subscription.getInterval(), null);
				cleaned++;
			}
		}

		if (cleaned > 0) {
			log.info("Cleanup finished: removed {} stale subscriptions. Active subscriptions: {}",
					cleaned, chartSubscriptionCache.size());
		}
	}

	/**
	 * Logs WebSocket connection status every 5 minutes.
	 * Useful for monitoring active connections.
	 */
	@Scheduled(fixedRate = 300000)
	public void logConnectionStatus() {
		log.info("WebSocket status - Ticker stream active: {}, Kline streams: {}, Chart subscriptions: {}",
				webSocketManager.isTickerStreamActive(),
				webSocketManager.getActiveKlineStreamCount(),
				chartSubscriptionCache.size());
	}
}
