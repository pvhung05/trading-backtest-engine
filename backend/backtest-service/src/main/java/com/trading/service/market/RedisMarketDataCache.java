package com.trading.service.market;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trading.model.Candle;

/**
 * Shared Redis cache service for market candles.
 * Key format: market:klines:{SYMBOL}:{TIMEFRAME}
 * Uses Redis Sorted Sets (ZSET) with score = openTime (epoch ms).
 * Inactivity TTL: 10 minutes (refreshed on each read & write).
 */
@Service
public class RedisMarketDataCache {

    private static final Logger logger = LoggerFactory.getLogger(RedisMarketDataCache.class);
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);
    private static final String KEY_PREFIX = "market:klines:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisMarketDataCache(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    private String buildKey(String symbol, String timeframe) {
        return KEY_PREFIX + symbol.toUpperCase() + ":" + timeframe.toLowerCase();
    }

    /**
     * Saves candles to Redis Sorted Set and refreshes the 10-minute TTL.
     */
    public void saveCandles(String symbol, String timeframe, List<Candle> candles) {
        if (candles == null || candles.isEmpty()) {
            return;
        }

        String key = buildKey(symbol, timeframe);
        try {
            Set<ZSetOperations.TypedTuple<String>> tuples = new HashSet<>();
            for (Candle c : candles) {
                try {
                    ObjectNode node = objectMapper.createObjectNode();
                    long openTimeMs = c.getOpenTime().toEpochMilli();
                    node.put("openTime", openTimeMs);
                    node.put("open", String.valueOf(c.getOpen()));
                    node.put("high", String.valueOf(c.getHigh()));
                    node.put("low", String.valueOf(c.getLow()));
                    node.put("close", String.valueOf(c.getClose()));
                    node.put("volume", String.valueOf(c.getVolume()));

                    String json = objectMapper.writeValueAsString(node);
                    tuples.add(ZSetOperations.TypedTuple.of(json, (double) openTimeMs));
                } catch (Exception e) {
                    logger.warn("Failed to serialize candle for Redis: {}", e.getMessage());
                }
            }

            if (!tuples.isEmpty()) {
                redisTemplate.opsForZSet().add(key, tuples);
                redisTemplate.expire(key, DEFAULT_TTL);
                logger.debug("Saved {} candles to Redis for {} (TTL 10m)", tuples.size(), key);
            }
        } catch (Exception e) {
            logger.warn("Redis saveCandles error for {}: {}", key, e.getMessage());
        }
    }

    /**
     * Loads candles from Redis within [startTime, endTime] and refreshes the 10-minute TTL.
     */
    public List<Candle> loadCandles(String symbol, String timeframe, Instant startTime, Instant endTime) {
        String key = buildKey(symbol, timeframe);
        try {
            Boolean exists = redisTemplate.hasKey(key);
            if (Boolean.FALSE.equals(exists)) {
                return Collections.emptyList();
            }

            // Sliding expiration: touch key on access
            redisTemplate.expire(key, DEFAULT_TTL);

            double min = (startTime != null) ? (double) startTime.toEpochMilli() : 0.0;
            double max = (endTime != null) ? (double) endTime.toEpochMilli() : Double.MAX_VALUE;

            Set<String> jsonSet = redisTemplate.opsForZSet().rangeByScore(key, min, max);
            if (jsonSet == null || jsonSet.isEmpty()) {
                return Collections.emptyList();
            }

            List<Candle> candles = new ArrayList<>();
            for (String json : jsonSet) {
                try {
                    JsonNode node = objectMapper.readTree(json);
                    long openTimeMs = node.get("openTime").asLong();
                    double open = Double.parseDouble(node.get("open").asText());
                    double high = Double.parseDouble(node.get("high").asText());
                    double low = Double.parseDouble(node.get("low").asText());
                    double close = Double.parseDouble(node.get("close").asText());
                    long volume = (long) Double.parseDouble(node.get("volume").asText("0"));

                    candles.add(new Candle(Instant.ofEpochMilli(openTimeMs), open, high, low, close, volume));
                } catch (Exception e) {
                    logger.warn("Failed to deserialize candle JSON from Redis: {}", e.getMessage());
                }
            }

            candles.sort(Comparator.comparing(Candle::getOpenTime));
            logger.debug("Loaded {} candles from Redis for {}", candles.size(), key);
            return candles;
        } catch (Exception e) {
            logger.warn("Redis loadCandles error for {}: {}", key, e.getMessage());
            return Collections.emptyList();
        }
    }
}
