package com.trading.apps.strategy.service;
import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.factory.TradingStrategyFactory;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Component
public class StrategyFactoryRegistry {
    private final Map<StrategyType, TradingStrategyFactory> factories = new HashMap<>();
    
    public StrategyFactoryRegistry(List<TradingStrategyFactory> factoryList) {
        for (TradingStrategyFactory factory : factoryList) {
            factories.put(factory.getType(), factory);
        }
    }

    public TradingStrategyFactory getFactory(StrategyType type) {
        TradingStrategyFactory factory = factories.get(type);
        if (factory == null) {
            throw new IllegalArgumentException("No factory found for strategy type: " + type);
        }
        return factory;
    }
}
