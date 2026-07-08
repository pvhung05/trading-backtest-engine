package com.trading.realtime.client.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.realtime.client.rest.dto.BinanceExchangeInfoResponse;
import com.trading.realtime.client.rest.dto.BinanceKlineResponse;
import com.trading.realtime.client.rest.dto.BinanceTicker24hrResponse;
import com.trading.realtime.exception.BinanceApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;

/**
 * HTTP client for Binance REST API.
 * Handles all communication with Binance REST endpoints for market data.
 * Uses WebClient for reactive HTTP calls.
 */
@Slf4j
@Component
public class BinanceRestClient {

	private final WebClient webClient;
	private final ObjectMapper objectMapper;

	public BinanceRestClient(
			@Value("${binance.rest.base-url}") String baseUrl,
			@Value("${binance.rest.connect-timeout:10000}") int connectTimeout,
			@Value("${binance.rest.read-timeout:10000}") int readTimeout,
			ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		this.webClient = WebClient.builder()
				.baseUrl(baseUrl)
				.codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
				.build();
		log.info("Binance REST client initialized with base URL: {}", baseUrl);
	}

	/**
	 * Fetches exchange information containing all trading pair metadata.
	 *
	 * @return BinanceExchangeInfoResponse containing symbol data
	 * @throws BinanceApiException if the API call fails
	 */
	public BinanceExchangeInfoResponse getExchangeInfo() {
		log.debug("Fetching exchange info from Binance");
		try {
			BinanceExchangeInfoResponse response = webClient.get()
					.uri("/api/v3/exchangeInfo")
					.retrieve()
					.bodyToMono(BinanceExchangeInfoResponse.class)
					.block();
			log.info("Fetched exchange info successfully");
			return response;
		} catch (WebClientResponseException e) {
			log.error("Binance API error while fetching exchange info: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
			throw new BinanceApiException("Failed to fetch exchange info: " + e.getMessage(), e);
		} catch (Exception e) {
			log.error("Network error while fetching exchange info", e);
			throw new BinanceApiException("Failed to connect to Binance: " + e.getMessage(), e);
		}
	}

	/**
	 * Fetches 24hr ticker statistics for all symbols.
	 *
	 * @return list of BinanceTicker24hrResponse
	 * @throws BinanceApiException if the API call fails
	 */
	public List<BinanceTicker24hrResponse> get24hrTickerAllSymbols() {
		log.debug("Fetching 24hr ticker for all symbols");
		try {
			BinanceTicker24hrResponse[] response = webClient.get()
					.uri("/api/v3/ticker/24hr")
					.retrieve()
					.bodyToMono(BinanceTicker24hrResponse[].class)
					.block();
			log.info("Fetched {} tickers successfully", response != null ? response.length : 0);
			return response != null ? List.of(response) : List.of();
		} catch (WebClientResponseException e) {
			log.error("Binance API error while fetching 24hr ticker: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
			throw new BinanceApiException("Failed to fetch 24hr ticker: " + e.getMessage(), e);
		} catch (Exception e) {
			log.error("Network error while fetching 24hr ticker", e);
			throw new BinanceApiException("Failed to connect to Binance: " + e.getMessage(), e);
		}
	}

	/**
	 * Fetches historical kline/candlestick data for a symbol.
	 *
	 * @param symbol   the trading pair symbol (e.g., BTCUSDT)
	 * @param interval the candlestick interval (e.g., 1m, 1h, 1d)
	 * @param limit    maximum number of klines to return (max 1500)
	 * @return list of BinanceKlineResponse
	 * @throws BinanceApiException if the API call fails
	 */
	public List<BinanceKlineResponse> getKlines(String symbol, String interval, Integer limit) {
		log.debug("Fetching klines for {} with interval {} and limit {}", symbol, interval, limit);
		try {
			List response = webClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/v3/klines")
							.queryParam("symbol", symbol)
							.queryParam("interval", interval)
							.queryParam("limit", limit)
							.build())
					.retrieve()
					.bodyToMono(List.class)
					.block();

			List<BinanceKlineResponse> klines = response.stream()
					.map(arr -> BinanceKlineResponse.fromArray((Object[]) arr))
					.toList();
			log.info("Fetched {} klines for {} {}", klines.size(), symbol, interval);
			return klines;
		} catch (WebClientResponseException e) {
			log.error("Binance API error while fetching klines: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
			throw new BinanceApiException("Failed to fetch klines: " + e.getMessage(), e);
		} catch (Exception e) {
			log.error("Network error while fetching klines", e);
			throw new BinanceApiException("Failed to connect to Binance: " + e.getMessage(), e);
		}
	}

	/**
	 * Fetches historical kline/candlestick data with time range.
	 *
	 * @param symbol    the trading pair symbol
	 * @param interval  the candlestick interval
	 * @param startTime start timestamp in milliseconds
	 * @param endTime   end timestamp in milliseconds
	 * @param limit     maximum number of klines to return
	 * @return list of BinanceKlineResponse
	 * @throws BinanceApiException if the API call fails
	 */
	public List<BinanceKlineResponse> getKlines(String symbol, String interval, Long startTime, Long endTime, Integer limit) {
		log.debug("Fetching klines for {} from {} to {}", symbol, startTime, endTime);
		try {
			List response = webClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/v3/klines")
							.queryParam("symbol", symbol)
							.queryParam("interval", interval)
							.queryParam("startTime", startTime)
							.queryParam("endTime", endTime)
							.queryParam("limit", limit)
							.build())
					.retrieve()
					.bodyToMono(List.class)
					.block();

			List<BinanceKlineResponse> klines = response.stream()
					.map(arr -> BinanceKlineResponse.fromArray((Object[]) arr))
					.toList();
			log.info("Fetched {} klines for {} [{} - {}]", klines.size(), symbol, startTime, endTime);
			return klines;
		} catch (WebClientResponseException e) {
			log.error("Binance API error while fetching klines: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
			throw new BinanceApiException("Failed to fetch klines: " + e.getMessage(), e);
		} catch (Exception e) {
			log.error("Network error while fetching klines", e);
			throw new BinanceApiException("Failed to connect to Binance: " + e.getMessage(), e);
		}
	}

	/**
	 * Tests connectivity to Binance API.
	 *
	 * @return true if API is reachable
	 */
	public boolean ping() {
		try {
			String response = webClient.get()
					.uri("/api/v3/ping")
					.retrieve()
					.bodyToMono(String.class)
					.block();
			return true;
		} catch (Exception e) {
			log.warn("Binance API ping failed: {}", e.getMessage());
			return false;
		}
	}
}
