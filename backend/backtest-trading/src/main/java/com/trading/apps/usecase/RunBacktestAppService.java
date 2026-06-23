package com.trading.apps.usecase;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.apps.auth.entity.AppUser;
import com.trading.apps.auth.repository.UserRepository;
import com.trading.apps.execution.model.ExecutionConfig;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.execution.service.ExecutionService;
import com.trading.apps.execution.service.TradeAnalyzerService;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.service.MarketDataService;
import com.trading.apps.metrics.model.MetricsResult;
import com.trading.apps.metrics.service.MetricsService;
import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.persistence.mapper.BacktestRunMapper;
import com.trading.apps.persistence.service.BacktestPersistenceService;
import com.trading.apps.portfolio.model.EquityPoint;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.portfolio.model.PortfolioResult;
import com.trading.apps.portfolio.service.PortfolioService;
import com.trading.apps.strategy.factory.TradingStrategyFactory;
import com.trading.apps.strategy.model.MacdParameters;
import com.trading.apps.strategy.model.RsiParameters;
import com.trading.apps.strategy.model.SmaCrossParameters;
import com.trading.apps.strategy.model.StrategyParameters;
import com.trading.apps.strategy.service.StrategyFactoryRegistry;
import com.trading.apps.backtest.service.BacktestEngine;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RunBacktestAppService {

    private final MarketDataService marketDataService;
    private final StrategyFactoryRegistry strategyFactoryRegistry;
    private final BacktestEngine backtestEngine;
    private final ExecutionService executionService;
    private final PortfolioService portfolioService;
    private final MetricsService metricsService;
    private final BacktestPersistenceService persistenceService;
    private final BacktestRunMapper backtestRunMapper;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final TradeAnalyzerService tradeAnalyzerService;

    /**
     * Runs the full backtest pipeline and persists the result for the given user.
     */
    public BacktestRun runAndSave(Long userId,
                                  String symbol,
                                  String timeframe,
                                  java.time.Instant startTime,
                                  java.time.Instant endTime,
                                  String strategyType,
                                  Map<String, Object> strategyParamsMap,
                                  double capital,
                                  double commissionRate,
                                  double slippageRate,
                                  double positionSizePct) {
        Objects.requireNonNull(userId, "userId cannot be null");
        Objects.requireNonNull(symbol, "symbol cannot be null");
        Objects.requireNonNull(timeframe, "timeframe cannot be null");
        Objects.requireNonNull(startTime, "startTime cannot be null");
        Objects.requireNonNull(endTime, "endTime cannot be null");
        Objects.requireNonNull(strategyType, "strategyType cannot be null");

        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        StrategyType type = StrategyType.valueOf(strategyType.toUpperCase());
        StrategyParameters params = toStrategyParameters(type, strategyParamsMap);
        String strategyParamsJson = serializeParams(strategyParamsMap);

        TradingStrategyFactory factory = strategyFactoryRegistry.getFactory(type);
        int warmupBars = factory.getRequiredWarmupBars(params);

        MarketDataRequest marketRequest = new MarketDataRequest(
                symbol.toUpperCase(), timeframe.toLowerCase(), startTime, endTime);
        BarSeries series = marketDataService.load(marketRequest, warmupBars);
        if (series == null || series.getBarCount() == 0) {
            throw new IllegalArgumentException("No market data returned for the requested period");
        }

        Strategy strategy = factory.build(series, params);
        TradingRecord tradingRecord = backtestEngine.run(series, strategy);

        ExecutionConfig execConfig = ExecutionConfig.builder()
                .commissionRate(commissionRate)
                .slippageRate(slippageRate)
                .positionSizePercent(positionSizePct)
                .build();

        List<ExecutedTrade> executedTrades = executionService.execute(
                tradingRecord, series, execConfig, capital, startTime);

        // Analyze trades: MFE, MAE, signals
        TradeAnalyzerService.TradeAnalysis[] analyses = tradeAnalyzerService.analyze(
                tradingRecord, series,
                factory.getEntrySignalName(),
                factory.getExitSignalName());

        // Calculate cumulative PnL
        double[] cumulativePnl = calculateCumulativePnl(executedTrades);

        PortfolioConfig portfolioConfig = PortfolioConfig.builder()
                .initialCapital(capital)
                .build();

        PortfolioResult portfolioResult = portfolioService.calculate(
                executedTrades, series, portfolioConfig, warmupBars);

        MetricsResult metricsResult = metricsService.calculate(executedTrades, portfolioResult);

        List<EquityPoint> equityPoints = portfolioResult.getEquityCurve();

        BacktestRun entity = backtestRunMapper.toEntity(
                user,
                null,
                metricsResult,
                executedTrades,
                toIsLongArray(analyses),
                toMfeArray(analyses),
                toMaeArray(analyses),
                cumulativePnl,
                toEntrySignals(analyses),
                toExitSignals(analyses),
                type,
                symbol.toUpperCase(),
                timeframe.toLowerCase(),
                startTime,
                endTime,
                null,
                strategyParamsJson,
                equityPoints);

        return persistenceService.saveBacktestResult(entity);
    }

    private double[] calculateCumulativePnl(List<ExecutedTrade> trades) {
        double[] cumulative = new double[trades.size()];
        double running = 0.0;
        for (int i = 0; i < trades.size(); i++) {
            running += trades.get(i).getNetProfit();
            cumulative[i] = running;
        }
        return cumulative;
    }

    private boolean[] toIsLongArray(TradeAnalyzerService.TradeAnalysis[] analyses) {
        boolean[] arr = new boolean[analyses.length];
        for (int i = 0; i < analyses.length; i++) {
            arr[i] = analyses[i].isLong();
        }
        return arr;
    }

    private double[] toMfeArray(TradeAnalyzerService.TradeAnalysis[] analyses) {
        double[] arr = new double[analyses.length];
        for (int i = 0; i < analyses.length; i++) {
            arr[i] = analyses[i].maxFavorableExcursion();
        }
        return arr;
    }

    private double[] toMaeArray(TradeAnalyzerService.TradeAnalysis[] analyses) {
        double[] arr = new double[analyses.length];
        for (int i = 0; i < analyses.length; i++) {
            arr[i] = analyses[i].maxAdverseExcursion();
        }
        return arr;
    }

    private String[] toEntrySignals(TradeAnalyzerService.TradeAnalysis[] analyses) {
        String[] arr = new String[analyses.length];
        for (int i = 0; i < analyses.length; i++) {
            arr[i] = analyses[i].entrySignal();
        }
        return arr;
    }

    private String[] toExitSignals(TradeAnalyzerService.TradeAnalysis[] analyses) {
        String[] arr = new String[analyses.length];
        for (int i = 0; i < analyses.length; i++) {
            arr[i] = analyses[i].exitSignal();
        }
        return arr;
    }

    private StrategyParameters toStrategyParameters(StrategyType type, Map<String, Object> params) {
        if (params == null) {
            throw new IllegalArgumentException("strategyParams is required");
        }
        return switch (type) {
            case SMA_CROSS -> new SmaCrossParameters(
                    getInt(params, "shortPeriod"),
                    getInt(params, "longPeriod"));
            case RSI -> new RsiParameters(
                    getInt(params, "period"),
                    getDouble(params, "overbought"),
                    getDouble(params, "oversold"));
            case MACD -> new MacdParameters(
                    getInt(params, "shortPeriod"),
                    getInt(params, "longPeriod"),
                    getInt(params, "signalPeriod"));
        };
    }

    private int getInt(Map<String, Object> params, String key) {
        Object value = params.get(key);
        if (value instanceof Number num) {
            return num.intValue();
        }
        throw new IllegalArgumentException(key + " must be a number");
    }

    private double getDouble(Map<String, Object> params, String key) {
        Object value = params.get(key);
        if (value instanceof Number num) {
            return num.doubleValue();
        }
        throw new IllegalArgumentException(key + " must be a number");
    }

    private String serializeParams(Map<String, Object> params) {
        try {
            return objectMapper.writeValueAsString(params);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
