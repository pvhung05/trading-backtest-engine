package com.trading.apps.strategy.model;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RsiParameters implements StrategyParameters {

    private Integer period;

    private Double overbought;

    private Double oversold;

}