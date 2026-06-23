package com.trading.apps.persistence.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.persistence.entity.EquityPointEntity;

@Component
public class EquityPointMapper {

    private static final int SCALE_DECIMALS = 4;

    public EquityPointEntity toEntity(BacktestRun run, com.trading.apps.portfolio.model.EquityPoint point) {
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
