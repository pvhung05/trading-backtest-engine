package com.trading.apps.persistence.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.persistence.entity.TradeRecord;
import com.trading.apps.persistence.enums.TradeSide;

@Component
public class TradeRecordMapper {

    private static final int SCALE_PRICE = 8;
    private static final int SCALE_PNL = 4;

    /**
     * Maps an executed trade to a TradeRecord entity with MFE, MAE, and cumulative PnL.
     *
     * @param run             the parent backtest run
     * @param tradeNumber     sequential trade number
     * @param executed        the executed trade from the execution service
     * @param isLong          true if long position, false if short
     * @param maxFavorable    max favorable excursion during the trade (in price units)
     * @param maxAdverse      max adverse excursion during the trade (in price units)
     * @param cumulativePnl   cumulative PnL up to and including this trade (in currency units)
     * @param entrySignal    name of the signal that triggered entry
     * @param exitSignal     name of the signal that triggered exit
     */
    public TradeRecord toEntity(BacktestRun run,
                                int tradeNumber,
                                ExecutedTrade executed,
                                boolean isLong,
                                double maxFavorable,
                                double maxAdverse,
                                double cumulativePnl,
                                String entrySignal,
                                String exitSignal) {
        TradeSide side = isLong ? TradeSide.LONG : TradeSide.SHORT;
        BigDecimal entryPrice = toBigDecimal(executed.getEntryPrice(), SCALE_PRICE);
        BigDecimal exitPrice = toBigDecimal(executed.getExitPrice(), SCALE_PRICE);
        BigDecimal quantity = toBigDecimal(executed.getQuantity(), SCALE_PRICE);
        BigDecimal grossProfit = toBigDecimal(executed.getGrossProfit(), SCALE_PRICE);
        BigDecimal commission = toBigDecimal(executed.getCommission(), SCALE_PRICE);
        BigDecimal slippageCost = toBigDecimal(executed.getSlippageCost(), SCALE_PRICE);
        BigDecimal netProfit = toBigDecimal(executed.getNetProfit(), SCALE_PRICE);

        BigDecimal returnPercent = BigDecimal.ZERO.setScale(SCALE_PNL, RoundingMode.HALF_UP);
        if (entryPrice.compareTo(BigDecimal.ZERO) > 0) {
            returnPercent = netProfit
                    .divide(entryPrice.multiply(quantity), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        BigDecimal sizeUsd = entryPrice.multiply(quantity).setScale(SCALE_PNL, RoundingMode.HALF_UP);

        // MFE and MAE in currency units
        BigDecimal mfe = BigDecimal.valueOf(maxFavorable)
                .multiply(quantity)
                .setScale(SCALE_PNL, RoundingMode.HALF_UP);
        BigDecimal mae = BigDecimal.valueOf(maxAdverse)
                .multiply(quantity)
                .setScale(SCALE_PNL, RoundingMode.HALF_UP);

        return TradeRecord.of(run, tradeNumber, side,
                executed.getEntryTime(), executed.getExitTime(),
                entryPrice, exitPrice, quantity,
                grossProfit, commission, slippageCost,
                netProfit, returnPercent, null,
                mfe, mae,
                BigDecimal.valueOf(cumulativePnl).setScale(SCALE_PNL, RoundingMode.HALF_UP),
                sizeUsd,
                entrySignal, exitSignal);
    }

    private BigDecimal toBigDecimal(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP);
    }
}
