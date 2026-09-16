package com.trading.mapper;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.mapper.MetricsSimulationResponseMapper;
import com.trading.mapper.PortfolioSimulationResponseMapper;
import com.trading.dto.response.ExecutedTradeResponse;
import com.trading.dto.response.MetricsSimulationResponse;
import com.trading.dto.response.PortfolioSimulationResponse;
import com.trading.dto.response.FullSimulationResponse;
import com.trading.dto.response.FullSimulationResponse.ExecutionMetadata;
import com.trading.model.ExecutedTrade;
import com.trading.model.ExecutionSimulationCommand;
import com.trading.model.MetricsResult;
import com.trading.model.PortfolioResult;

/**
 * Maps domain models to the unified {@link FullSimulationResponse} DTO.
 * Combines outputs from execution, portfolio, and metrics layers.
 */
@Component
public class FullSimulationResponseMapper {

    private final PortfolioSimulationResponseMapper portfolioMapper;
    private final MetricsSimulationResponseMapper metricsMapper;

    public FullSimulationResponseMapper(
            PortfolioSimulationResponseMapper portfolioMapper,
            MetricsSimulationResponseMapper metricsMapper) {
        this.portfolioMapper = portfolioMapper;
        this.metricsMapper = metricsMapper;
    }

    /**
     * Builds a complete simulation response from domain results.
     *
     * @param command       original simulation command (provides config/metadata)
     * @param executedTrades list of simulated executed trades
     * @param portfolioResult result of portfolio equity curve calculation
     * @param metricsResult  result of performance metrics calculation
     * @return unified full simulation response
     */
    public FullSimulationResponse toResponse(
            ExecutionSimulationCommand command,
            List<ExecutedTrade> executedTrades,
            PortfolioResult portfolioResult,
            MetricsResult metricsResult) {

        ExecutionMetadata metadata = buildMetadata(command);
        List<ExecutedTradeResponse> trades = toTradeResponses(executedTrades);
        PortfolioSimulationResponse portfolio = portfolioMapper.toResponse(command, portfolioResult);
        MetricsSimulationResponse metrics = metricsMapper.toResponse(metricsResult);

        return new FullSimulationResponse(metadata, trades, portfolio, metrics);
    }

    private ExecutionMetadata buildMetadata(ExecutionSimulationCommand command) {
        return new ExecutionMetadata(
                command.getMarketDataRequest().getSymbol(),
                command.getMarketDataRequest().getTimeframe(),
                command.getMarketDataRequest().getStartTime().toString(),
                command.getMarketDataRequest().getEndTime().toString(),
                command.getStrategyType().name(),
                command.getCapital(),
                command.getExecutionConfig().getCommissionRate(),
                command.getExecutionConfig().getSlippageRate(),
                command.getExecutionConfig().getPositionSizePercent());
    }

    private List<ExecutedTradeResponse> toTradeResponses(List<ExecutedTrade> trades) {
        List<ExecutedTradeResponse> responses = new ArrayList<>();
        if (trades != null) {
            for (ExecutedTrade trade : trades) {
                responses.add(new ExecutedTradeResponse(
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
        return responses;
    }
}
