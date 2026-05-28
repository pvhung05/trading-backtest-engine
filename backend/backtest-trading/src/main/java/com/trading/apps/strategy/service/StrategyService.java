package com.trading.apps.strategy.service;

import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.factory.TradingStrategyFactory;
import com.trading.apps.strategy.model.StrategyParameters;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import org.ta4j.core.BarSeries;
import org.ta4j.core.Strategy;

@Service
@RequiredArgsConstructor
public class StrategyService {

    private final StrategyFactoryRegistry registry;

    public Strategy buildStrategy(
            StrategyType strategyType,
            BarSeries series,
            StrategyParameters parameters
    ) {

        TradingStrategyFactory factory =
                registry.getFactory(strategyType);

        return factory.build(
                series,
                parameters
        );
    }

        public int getRequiredWarmupBars(
                        StrategyType strategyType,
                        StrategyParameters parameters
        ) {
                TradingStrategyFactory factory = registry.getFactory(strategyType);
                return factory.getRequiredWarmupBars(parameters);
        }
}