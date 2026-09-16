package com.trading.mapper;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.dto.response.ExecutionSimulationResponse;
import com.trading.model.ExecutedTrade;
import com.trading.model.ExecutionSimulationCommand;
import com.trading.dto.response.ExecutedTradeResponse;

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