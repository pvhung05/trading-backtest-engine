package com.trading.apps.backtest.model;

import java.util.List;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

/**
 * Domain model containing the list of completed trades from a backtest run.
 */
@Value
@Builder
public class BacktestResult {

    @Singular("trade")
    List<Trade> trades;
}