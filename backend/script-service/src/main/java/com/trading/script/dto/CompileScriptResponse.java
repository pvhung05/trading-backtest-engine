package com.trading.script.dto;

import java.util.List;
import java.util.Map;
import com.trading.script.compiler.PlotDefinition;
import lombok.Builder;

@Builder
public record CompileScriptResponse(
        boolean success,
        String strategyTitle,
        String error,
        Integer line,
        Integer column,
        int warmupBarsRequired,
        int complexityScore,
        String sourceHash,
        Map<String, Object> entryRule,
        Map<String, Object> exitRule,
        String startTime,
        String endTime,
        String timeframe,
        List<PlotDefinition> plots
) {}
