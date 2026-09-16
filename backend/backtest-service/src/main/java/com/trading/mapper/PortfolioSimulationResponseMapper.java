package com.trading.mapper;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.dto.response.EquityCurvePointResponse;
import com.trading.dto.response.EquityCurveResponse;
import com.trading.dto.response.PortfolioSimulationResponse;
import com.trading.dto.response.PortfolioStatsResponse;
import com.trading.model.ExecutionSimulationCommand;
import com.trading.model.EquityPoint;
import com.trading.model.Portfolio;
import com.trading.model.PortfolioResult;

/**
 * Maps the domain result of a full portfolio simulation to API response DTOs.
 */
@Component
public class PortfolioSimulationResponseMapper {

    public PortfolioSimulationResponse toResponse(
            ExecutionSimulationCommand command,
            PortfolioResult portfolioResult) {

        int tradeCount = computeTradeCount(portfolioResult);
        EquityCurveResponse equityCurve = toEquityCurve(portfolioResult);
        PortfolioStatsResponse stats = toStats(command, portfolioResult);

        return new PortfolioSimulationResponse(
                command.getMarketDataRequest().getSymbol(),
                command.getMarketDataRequest().getTimeframe(),
                command.getMarketDataRequest().getStartTime().toString(),
                command.getMarketDataRequest().getEndTime().toString(),
                command.getStrategyType().name(),
                command.getCapital(),
                command.getExecutionConfig().getCommissionRate(),
                command.getExecutionConfig().getSlippageRate(),
                command.getExecutionConfig().getPositionSizePercent(),
                tradeCount,
                equityCurve,
                stats);
    }

    private int computeTradeCount(PortfolioResult result) {
        if (result == null || result.getSnapshots() == null) {
            return 0;
        }
        return result.getSnapshots().size();
    }

    private EquityCurveResponse toEquityCurve(PortfolioResult result) {
        List<EquityCurvePointResponse> points = new ArrayList<>();
        if (result != null && result.getEquityCurve() != null) {
            for (EquityPoint ep : result.getEquityCurve()) {
                points.add(new EquityCurvePointResponse(
                        ep.getTimestamp() != null ? ep.getTimestamp().toString() : null,
                        ep.getEquity(),
                        ep.isOpenPosition(),
                        ep.getOpenPositionPnl()));
            }
        }
        return new EquityCurveResponse(points);
    }

    private PortfolioStatsResponse toStats(ExecutionSimulationCommand command, PortfolioResult result) {
        double initialCapital = command.getCapital();
        double finalEquity = initialCapital;
        int tradeCount = 0;

        if (result != null) {
            Portfolio portfolio = result.getPortfolio();
            if (portfolio != null) {
                finalEquity = portfolio.getCurrentBalance();
            }
            if (result.getSnapshots() != null) {
                tradeCount = result.getSnapshots().size();
            }
        }

        double totalReturn = finalEquity - initialCapital;
        double totalReturnPercent = (initialCapital > 0.0d)
                ? (totalReturn / initialCapital) * 100.0d
                : 0.0d;

        return new PortfolioStatsResponse(
                initialCapital,
                finalEquity,
                totalReturn,
                totalReturnPercent,
                tradeCount);
    }
}
