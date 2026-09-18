package com.trading.realtime.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.realtime.model.Kline;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for caching Kline / Candlestick data into Redis using Sorted Sets (ZSET).
 * Keys: market:klines:{SYMBOL}:{INTERVAL}
 * Score: openTime in epoch milliseconds
 * Value: JSON representation of Kline
 * Expiration: 10 minutes sliding TTL (refreshed on every read and write).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisKlineCacheService {

	private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);
	private static final String KEY_PREFIX = "market:klines:";

	private final StringRedisTemplate redisTemplate;
	private final ObjectMapper objectMapper;

	private String buildKey(String symbol, String interval) {
		return KEY_PREFIX + symbol.toUpperCase() + ":" + interval.toLowerCase();
	}

	/**
	 * Saves a list of klines to Redis and sets/refreshes the 10-minute expiration TTL.
	 */
	public void saveKlines(String symbol, String interval, List<Kline> klines) {
		if (klines == null || klines.isEmpty()) {
			return;
		}

		String key = buildKey(symbol, interval);
		try {
			Set<ZSetOperations.TypedTuple<String>> tuples = new HashSet<>();
			for (Kline k : klines) {
				try {
					String json = objectMapper.writeValueAsString(k);
					tuples.add(ZSetOperations.TypedTuple.of(json, (double) k.getOpenTime()));
				} catch (JsonProcessingException e) {
					log.warn("Failed to serialize kline for Redis: {}", e.getMessage());
				}
			}

			if (!tuples.isEmpty()) {
				redisTemplate.opsForZSet().add(key, tuples);
				redisTemplate.expire(key, DEFAULT_TTL);
				log.debug("Saved {} klines to Redis for {} (TTL 10m)", tuples.size(), key);
			}
		} catch (Exception e) {
			log.warn("Redis saveKlines error for {}: {}", key, e.getMessage());
		}
	}

	/**
	 * Saves or updates a single kline in Redis and refreshes the 10-minute TTL.
	 */
	public void saveKline(String symbol, String interval, Kline kline) {
		if (kline == null) {
			return;
		}

		String key = buildKey(symbol, interval);
		try {
			// First, remove existing candle with the same openTime if present
			double score = (double) kline.getOpenTime();
			redisTemplate.opsForZSet().removeRangeByScore(key, score, score);

			String json = objectMapper.writeValueAsString(kline);
			redisTemplate.opsForZSet().add(key, json, score);
			redisTemplate.expire(key, DEFAULT_TTL);
			log.debug("Saved single kline to Redis for {} at {} (TTL 10m)", key, kline.getOpenTime());
		} catch (Exception e) {
			log.warn("Redis saveKline error for {}: {}", key, e.getMessage());
		}
	}

	/**
	 * Fetches klines from Redis within the given time range or limit, and refreshes the 10-minute TTL.
	 */
	public List<Kline> getKlines(String symbol, String interval, Long startTime, Long endTime, Integer limit) {
		String key = buildKey(symbol, interval);
		try {
			Boolean exists = redisTemplate.hasKey(key);
			if (Boolean.FALSE.equals(exists)) {
				return Collections.emptyList();
			}

			// Sliding expiration: touch key on access
			redisTemplate.expire(key, DEFAULT_TTL);

			double min = (startTime != null) ? startTime.doubleValue() : 0.0;
			double max = (endTime != null) ? endTime.doubleValue() : Double.MAX_VALUE;

			Set<String> jsonSet;
			if (limit != null && limit > 0 && (startTime == null || endTime != null)) {
				// Get latest or before endTime
				jsonSet = redisTemplate.opsForZSet().reverseRangeByScore(key, min, max, 0, limit);
			} else {
				jsonSet = redisTemplate.opsForZSet().rangeByScore(key, min, max);
			}

			if (jsonSet == null || jsonSet.isEmpty()) {
				return Collections.emptyList();
			}

			List<Kline> results = new ArrayList<>();
			for (String json : jsonSet) {
				try {
					Kline k = objectMapper.readValue(json, Kline.class);
					results.add(k);
				} catch (Exception e) {
					log.warn("Failed to deserialize kline JSON from Redis: {}", e.getMessage());
				}
			}

			// Ensure chronological order
			results.sort(Comparator.comparingLong(Kline::getOpenTime));
			log.debug("Retrieved {} klines from Redis for {}", results.size(), key);
			return results;
		} catch (Exception e) {
			log.warn("Redis getKlines error for {}: {}", key, e.getMessage());
			return Collections.emptyList();
		}
	}
}
