package com.trading.apps.strategy.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MacdParameters implements StrategyParameters {
    
    private Integer shortPeriod;
    
    private Integer longPeriod;
    
    private Integer signalPeriod;
}
