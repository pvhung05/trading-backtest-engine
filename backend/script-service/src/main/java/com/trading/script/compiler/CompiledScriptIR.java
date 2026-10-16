package com.trading.script.compiler;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompiledScriptIR {
    private String strategyTitle;
    private Map<String, Object> entryRule;
    private Map<String, Object> exitRule;
    private int warmupBarsRequired;
    private int complexityScore;
    private String sourceHash;
    private Double initialCapital;
    private Double defaultQtyValue;
    private Double commissionValue;
    private Boolean overlay;
    private String startTime;
    private String endTime;
    private String timeframe;
    private List<PlotDefinition> plots;
}

