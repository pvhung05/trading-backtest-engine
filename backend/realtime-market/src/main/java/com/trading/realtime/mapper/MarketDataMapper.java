package com.trading.realtime.mapper;

import com.trading.realtime.api.response.KlineResponse;
import com.trading.realtime.api.response.MarketTickerResponse;
import com.trading.realtime.api.response.RealtimeKlineEvent;
import com.trading.realtime.api.response.RealtimeTickerEvent;
import com.trading.realtime.api.response.SymbolResponse;
import com.trading.realtime.client.rest.dto.BinanceTicker24hrResponse;
import com.trading.realtime.model.Kline;
import com.trading.realtime.model.MarketTicker;
import com.trading.realtime.model.SymbolInfo;
import org.springframework.stereotype.Component;

/**
 * Mapper component for converting between domain models, DTOs, and API responses.
 */
@Component
public class MarketDataMapper {

	/**
	 * Converts SymbolInfo domain model to SymbolResponse DTO.
	 *
	 * @param symbolInfo the domain model
	 * @return the response DTO
	 */
	public SymbolResponse toSymbolResponse(SymbolInfo symbolInfo) {
		return SymbolResponse.builder()
				.symbol(symbolInfo.symbol())
				.baseAsset(symbolInfo.baseAsset())
				.quoteAsset(symbolInfo.quoteAsset())
				.status(symbolInfo.status())
				.build();
	}

	/**
	 * Converts MarketTicker domain model to MarketTickerResponse DTO.
	 *
	 * @param ticker the domain model
	 * @return the response DTO
	 */
	public MarketTickerResponse toMarketTickerResponse(MarketTicker ticker) {
		return MarketTickerResponse.builder()
				.symbol(ticker.getSymbol())
				.lastPrice(ticker.getLastPrice())
				.priceChange(ticker.getPriceChange())
				.priceChangePercent(ticker.getPriceChangePercent())
				.highPrice(ticker.getHighPrice())
				.lowPrice(ticker.getLowPrice())
				.volume(ticker.getVolume())
				.quoteVolume(ticker.getQuoteVolume())
				.updateTime(ticker.getCloseTime())
				.build();
	}

	/**
	 * Converts Binance ticker response to MarketTicker domain model.
	 *
	 * @param response the Binance API response
	 * @return the domain model
	 */
	public MarketTicker toMarketTicker(BinanceTicker24hrResponse response) {
		return MarketTicker.builder()
				.symbol(response.getSymbol())
				.lastPrice(response.getLastPrice())
				.priceChange(response.getPriceChange())
				.priceChangePercent(response.getPriceChangePercent())
				.highPrice(response.getHighPrice())
				.lowPrice(response.getLowPrice())
				.volume(response.getVolume())
				.quoteVolume(response.getQuoteVolume())
				.openTime(response.getOpenTime())
				.closeTime(response.getCloseTime())
				.count(response.getCount())
				.build();
	}

	/**
	 * Converts Kline domain model to KlineResponse DTO.
	 *
	 * @param kline the domain model
	 * @return the response DTO
	 */
	public KlineResponse toKlineResponse(Kline kline) {
		return KlineResponse.builder()
				.openTime(kline.getOpenTime())
				.open(kline.getOpen())
				.high(kline.getHigh())
				.low(kline.getLow())
				.close(kline.getClose())
				.volume(kline.getVolume())
				.closeTime(kline.getCloseTime())
				.quoteVolume(kline.getQuoteVolume())
				.trades(kline.getTrades())
				.isClosed(true)
				.build();
	}

	/**
	 * Converts Binance kline response to Kline domain model.
	 *
	 * @param response the Binance API response
	 * @return the domain model
	 */
	public Kline toKline(com.trading.realtime.client.rest.dto.BinanceKlineResponse response) {
		return Kline.builder()
				.openTime(response.getOpenTime())
				.open(response.getOpen())
				.high(response.getHigh())
				.low(response.getLow())
				.close(response.getClose())
				.volume(response.getVolume())
				.closeTime(response.getCloseTime())
				.quoteVolume(response.getQuoteVolume())
				.trades(response.getTrades())
				.takerBuyBaseVolume(response.getTakerBuyBaseVolume())
				.takerBuyQuoteVolume(response.getTakerBuyQuoteVolume())
				.isClosed(Boolean.TRUE.equals(response.getIsClosed()))
				.build();
	}

	/**
	 * Converts MarketTicker to RealtimeTickerEvent for WebSocket broadcast.
	 *
	 * @param ticker the domain model
	 * @return the event DTO
	 */
	public RealtimeTickerEvent toRealtimeTickerEvent(MarketTicker ticker) {
		return RealtimeTickerEvent.builder()
				.symbol(ticker.getSymbol())
				.lastPrice(ticker.getLastPrice())
				.priceChange(ticker.getPriceChange())
				.priceChangePercent(ticker.getPriceChangePercent())
				.highPrice(ticker.getHighPrice())
				.lowPrice(ticker.getLowPrice())
				.volume(ticker.getVolume())
				.quoteVolume(ticker.getQuoteVolume())
				.updateTime(System.currentTimeMillis())
				.build();
	}

	/**
	 * Converts Kline to RealtimeKlineEvent for WebSocket broadcast.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @param kline    the domain model
	 * @return the event DTO
	 */
	public RealtimeKlineEvent toRealtimeKlineEvent(String symbol, String interval, Kline kline) {
		return RealtimeKlineEvent.builder()
				.symbol(symbol)
				.interval(interval)
				.openTime(kline.getOpenTime())
				.open(kline.getOpen())
				.high(kline.getHigh())
				.low(kline.getLow())
				.close(kline.getClose())
				.volume(kline.getVolume())
				.closeTime(kline.getCloseTime())
				.quoteVolume(kline.getQuoteVolume())
				.trades(kline.getTrades())
				.isClosed(kline.getIsClosed())
				.build();
	}
}
