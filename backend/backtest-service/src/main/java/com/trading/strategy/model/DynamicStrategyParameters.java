package com.trading.strategy.model;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DynamicStrategyParameters implements StrategyParameters {
    private Map<String, Object> entryRule;
    private Map<String, Object> exitRule;
    private Integer warmupBars;
    private String entrySignalName;
    private String exitSignalName;

    public int getWarmupBarsOrDefault() {
        return (warmupBars != null && warmupBars > 0) ? warmupBars : 50;
    }

    public String getEntrySignalNameOrDefault() {
        return (entrySignalName != null && !entrySignalName.isBlank()) ? entrySignalName : "Dynamic Entry";
    }

    public String getExitSignalNameOrDefault() {
        return (exitSignalName != null && !exitSignalName.isBlank()) ? exitSignalName : "Dynamic Exit";
    }
}
