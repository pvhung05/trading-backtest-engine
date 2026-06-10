package com.trading.apps.api.mapper.backtest;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.api.response.backtest.BacktestTradeResponse;
import com.trading.apps.api.response.backtest.BacktestTradingRecordResponse;
import com.trading.apps.backtest.model.BacktestCommand;
import com.trading.apps.backtest.model.BacktestResult;
import com.trading.apps.backtest.model.Trade;

/**
 * Maps the backtest domain result into API DTOs.
 */
@Component
public class BacktestTradingRecordResponseMapper {

    public BacktestTradingRecordResponse toResponse(BacktestCommand command, BacktestResult result) {
        List<BacktestTradeResponse> trades = new ArrayList<>();

        if (result != null && result.getTrades() != null) {
            for (Trade trade : result.getTrades()) {
                trades.add(new BacktestTradeResponse(
                        trade.getEntryTime().toString(),
                        trade.getEntryPrice(),
                        trade.getExitTime().toString(),
                        trade.getExitPrice(),
                        trade.getProfitPercent()));
            }
        }

        return new BacktestTradingRecordResponse(
                command.getMarketDataRequest().getSymbol(),
                command.getMarketDataRequest().getTimeframe(),
                command.getMarketDataRequest().getStartTime().toString(),
                command.getMarketDataRequest().getEndTime().toString(),
                command.getStrategyType().name(),
                trades.size(),
                trades);
    }
}