package com.trading.apps.api.mapper.execution;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.api.response.execution.ExecutionSimulationResponse;
import com.trading.apps.api.response.execution.ExecutedTradeResponse;
import com.trading.apps.execution.model.ExecutionSimulationCommand;
import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Maps executed trades to API response DTOs.
 */
@Component
public class ExecutionSimulationResponseMapper {

    public ExecutionSimulationResponse toResponse(ExecutionSimulationCommand command, List<ExecutedTrade> executedTrades) {
        List<ExecutedTradeResponse> trades = new ArrayList<>();

        if (executedTrades != null) {
            for (ExecutedTrade trade : executedTrades) {
                trades.add(new ExecutedTradeResponse(
                        trade.getEntryTime().toString(),
                        trade.getExitTime().toString(),
                        trade.getEntryPrice(),
                        trade.getExitPrice(),
                        trade.getQuantity(),
                        trade.getGrossProfit(),
                        trade.getCommission(),
                        trade.getSlippageCost(),
                        trade.getNetProfit()));
            }
        }

        return new ExecutionSimulationResponse(
                command.getMarketDataRequest().getSymbol(),
                command.getMarketDataRequest().getTimeframe(),
                command.getMarketDataRequest().getStartTime().toString(),
                command.getMarketDataRequest().getEndTime().toString(),
                command.getStrategyType().name(),
                command.getCapital(),
                command.getExecutionConfig().getCommissionRate(),
                command.getExecutionConfig().getSlippageRate(),
                command.getExecutionConfig().getPositionSizePercent(),
                trades.size(),
                trades);
    }
}