package com.trading.script.compiler;

public record PlotDefinition(
        String title,
        String indicator,
        Integer period,
        String color,
        Integer linewidth
) {}
