/**
 * Market module - Production-grade market data provider for trading backtest engine.
 *
 * Responsibilities:
 * - Load market data from Binance API
 * - Cache full datasets for efficient reuse
 * - Convert raw data to TA4J BarSeries format
 * - Provide clean API boundary between backtest engine and data sources
 *
 * Architecture:
 * - Entry point: MarketDataService
 * - Backtest engine ONLY depends on MarketDataService
 * - Backtest engine does NOT know about: API, caching, JSON, REST, CSV, etc.
 *
 * Usage:
 * <pre>
 * {@code
 * MarketDataRequest request = new MarketDataRequest("BTCUSDT", "5m", start, end);
 * BarSeries series = marketDataService.load(request);
 * }
 * </pre>
 *
 * @author Trading System
 */
package com.trading.apps.market;