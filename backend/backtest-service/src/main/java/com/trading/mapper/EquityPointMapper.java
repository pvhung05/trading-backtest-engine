package com.trading.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.trading.model.BacktestRun;
import com.trading.model.EquityPointEntity;

@Component
public class EquityPointMapper {

    private static final int SCALE_DECIMALS = 4;

    public EquityPointEntity toEntity(BacktestRun run, com.trading.model.EquityPoint point) {
        return EquityPointEntity.of(run,
                point.getTimestamp(),
                toBigDecimal(point.getEquity()),
                toBigDecimal(point.getEquity()),
                toBigDecimal(point.getOpenPositionPnl()),
                point.isOpenPosition() ? 1 : 0);
    }

    private BigDecimal toBigDecimal(double value) {
        return BigDecimal.valueOf(value).setScale(SCALE_DECIMALS, RoundingMode.HALF_UP);
    }
}
