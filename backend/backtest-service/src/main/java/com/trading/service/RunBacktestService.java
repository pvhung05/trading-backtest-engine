package com.trading.service;

import java.time.Instant;
import java.util.Map;
import com.trading.model.BacktestRun;

public interface RunBacktestService {

    BacktestRun runAndSave(Long userId,
                           String symbol,
                           String timeframe,
                           Instant startTime,
                           Instant endTime,
                           String strategyType,
                           Map<String, Object> strategyParamsMap,
                           double capital,
                           double commissionRate,
                           double slippageRate,
                           double positionSizePct);
}
