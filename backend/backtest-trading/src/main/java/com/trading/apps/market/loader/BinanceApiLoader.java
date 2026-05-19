package com.trading.apps.market.loader;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.apps.market.exception.MarketDataException;
import com.trading.apps.market.model.Candle;

/**
 * Loads market data from Binance REST API.
 * Handles API calls, response parsing, and error handling.
 *
 * Uses Binance spot trading /api/v3/klines endpoint for historical candle data.
 *
 * @author Trading System
 */
@Component
public class BinanceApiLoader {

    private static final Logger logger = LoggerFactory.getLogger(BinanceApiLoader.class);

    private static final String BINANCE_API_BASE_URL = "https://api.binance.com";
    private static final String KLINES_ENDPOINT = "/api/v3/klines";
    private static final int BINANCE_MAX_LIMIT = 1000;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String binanceApiBaseUrl;

    /**
     * Constructs a BinanceApiLoader with dependency injection.
     *
     * @param restTemplate        the RestTemplate for HTTP calls
     * @param objectMapper        the ObjectMapper for JSON parsing
     * @param binanceApiBaseUrl   the base URL for Binance API (injectable for testing)
     */
    public BinanceApiLoader(RestTemplate restTemplate, ObjectMapper objectMapper,
                           @Value("${binance.api.base-url:" + BINANCE_API_BASE_URL + "}") String binanceApiBaseUrl) {
        this.restTemplate = Objects.requireNonNull(restTemplate, "restTemplate cannot be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper cannot be null");
        this.binanceApiBaseUrl = Objects.requireNonNull(binanceApiBaseUrl, "binanceApiBaseUrl cannot be null");
    }

    /**
     * Loads candles from Binance API for the specified parameters.
     *
     * @param symbol    the trading symbol (e.g., "BTCUSDT")
     * @param timeframe the timeframe (e.g., "5m", "1h")
     * @param startTime the start time for the candles
     * @param endTime   the end time for the candles
     * @return a list of Candle objects
     * @throws MarketDataException if the API call fails or response is invalid
     */
    public List<Candle> loadCandles(String symbol, String timeframe, Instant startTime, Instant endTime) {
        Objects.requireNonNull(symbol, "symbol cannot be null");
        Objects.requireNonNull(timeframe, "timeframe cannot be null");
        Objects.requireNonNull(startTime, "startTime cannot be null");
        Objects.requireNonNull(endTime, "endTime cannot be null");

        logger.info("Loading candles from Binance for {} {} from {} to {}",
                symbol, timeframe, startTime, endTime);

        List<Candle> allCandles = new ArrayList<>();
        long currentStartTime = startTime.toEpochMilli();
        long endTimeMs = endTime.toEpochMilli();

        while (currentStartTime < endTimeMs) {
            try {
                List<Candle> batch = fetchCandleBatch(symbol, timeframe, currentStartTime, endTimeMs);

                if (batch.isEmpty()) {
                    logger.debug("No more candles available from Binance for {} {}", symbol, timeframe);
                    break;
                }

                allCandles.addAll(batch);

                // Update start time for next batch (exclusive of last candle to avoid duplicates)
                Candle lastCandle = batch.get(batch.size() - 1);
                currentStartTime = lastCandle.getOpenTime().toEpochMilli() + 1;

                // Small delay to avoid rate limiting
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new MarketDataException("Interrupted while loading candles", e);
            }
        }

        logger.info("Loaded {} candles from Binance for {} {}", allCandles.size(), symbol, timeframe);
        return allCandles;
    }

    /**
     * Fetches a batch of candles from Binance API.
     *
     * @param symbol       the trading symbol
     * @param timeframe    the timeframe
     * @param startTimeMs  the start time in milliseconds
     * @param endTimeMs    the end time in milliseconds
     * @return a list of candles from the batch
     */
    private List<Candle> fetchCandleBatch(String symbol, String timeframe, long startTimeMs, long endTimeMs) {
        String url = buildKlinesUrl(symbol, timeframe, startTimeMs, endTimeMs);
        logger.debug("Calling Binance API: {}", url);

        try {
            String response = restTemplate.getForObject(url, String.class);
            return parseKlinesResponse(response);
        } catch (RestClientException e) {
            throw new MarketDataException(
                    String.format("Failed to load candles from Binance for %s %s", symbol, timeframe), e);
        }
    }

    /**
     * Builds the Binance klines API URL.
     *
     * @param symbol      the trading symbol
     * @param timeframe   the timeframe
     * @param startTimeMs the start time in milliseconds
     * @param endTimeMs   the end time in milliseconds
     * @return the complete API URL
     */
    private String buildKlinesUrl(String symbol, String timeframe, long startTimeMs, long endTimeMs) {
        return String.format("%s%s?symbol=%s&interval=%s&startTime=%d&endTime=%d&limit=%d",
                binanceApiBaseUrl, KLINES_ENDPOINT, symbol, timeframe, startTimeMs, endTimeMs, BINANCE_MAX_LIMIT);
    }

    /**
     * Parses the JSON response from Binance klines endpoint.
     *
     * Binance klines response format:
     * [[openTime, open, high, low, close, volume, closeTime, quoteAssetVolume, ...], ...]
     *
     * @param jsonResponse the JSON response string
     * @return a list of parsed candles
     * @throws MarketDataException if parsing fails
     */
    private List<Candle> parseKlinesResponse(String jsonResponse) {
        List<Candle> candles = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(jsonResponse);

            if (!root.isArray()) {
                throw new MarketDataException("Unexpected Binance API response format: not an array");
            }

            for (JsonNode klineNode : root) {
                if (!klineNode.isArray() || klineNode.size() < 5) {
                    logger.warn("Skipping malformed kline entry: {}", klineNode);
                    continue;
                }

                Candle candle = parseKlineArray(klineNode);
                candles.add(candle);
            }
        } catch (Exception e) {
            throw new MarketDataException("Failed to parse Binance klines response", e);
        }

        return candles;
    }

    /**
     * Parses a single kline array from Binance response.
     *
     * Binance kline array format:
     * [0] = openTime (ms)
     * [1] = open price (string)
     * [2] = high price (string)
     * [3] = low price (string)
     * [4] = close price (string)
     * [5] = volume (string)
     * [6] = closeTime (ms)
     * ... (other fields not needed)
     *
     * @param klineNode the JSON node representing a kline
     * @return parsed Candle object
     */
    private Candle parseKlineArray(JsonNode klineNode) {
        long openTimeMs = klineNode.get(0).asLong();
        double open = klineNode.get(1).asDouble();
        double high = klineNode.get(2).asDouble();
        double low = klineNode.get(3).asDouble();
        double close = klineNode.get(4).asDouble();
        long volume = klineNode.get(5).asLong();

        Instant openTime = Instant.ofEpochMilli(openTimeMs);

        return new Candle(openTime, open, high, low, close, volume);
    }
}
