package com.trading.script.compiler;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PineScriptCompilerTest {

    private PineScriptCompiler compiler;

    @BeforeEach
    void setUp() {
        compiler = new PineScriptCompiler();
    }

    @Test
    @DisplayName("Should compile a basic EMA Cross script successfully")
    void shouldCompileBasicEmaCross() {
        String script = """
                //@version=5
                strategy("Basic EMA Cross", overlay=true)
                
                fastEMA = ta.ema(close, 9)
                slowEMA = ta.ema(close, 21)
                
                if ta.crossover(fastEMA, slowEMA)
                    strategy.entry("Long", strategy.long)
                    
                if ta.crossunder(fastEMA, slowEMA)
                    strategy.close("Long")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("Basic EMA Cross", ir.getStrategyTitle());
        assertNotNull(ir.getEntryRule());
        assertNotNull(ir.getExitRule());
        assertEquals("CROSSED_UP", ir.getEntryRule().get("type"));
        assertEquals("CROSSED_DOWN", ir.getExitRule().get("type"));
        assertTrue(ir.getWarmupBarsRequired() >= 31);
        assertNotNull(ir.getSourceHash());
    }

    @Test
    @DisplayName("Should compile RSI threshold strategy successfully")
    void shouldCompileRsiThresholdStrategy() {
        String script = """
                strategy("RSI Reversal")
                rsiVal = ta.rsi(close, 14)
                
                if rsiVal < 30
                    strategy.entry("Long", strategy.long)
                    
                if rsiVal > 70
                    strategy.close("Long")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("RSI Reversal", ir.getStrategyTitle());
        assertEquals("LESS_THAN", ir.getEntryRule().get("type"));
        assertEquals("GREATER_THAN", ir.getExitRule().get("type"));
    }

    @Test
    @DisplayName("Should compile English shorthand strategy notation via regex transpiler")
    void shouldCompileEnglishShorthandScript() {
        String script = """
                BUY: ema(9) cross_up ema(21) and rsi(14) < 70
                SELL: ema(9) cross_down ema(21) or rsi(14) > 80
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertNotNull(ir.getEntryRule());
        assertNotNull(ir.getExitRule());
        assertEquals("AND", ir.getEntryRule().get("type"));
        assertEquals("OR", ir.getExitRule().get("type"));
        assertTrue(ir.getWarmupBarsRequired() >= 31);
    }

    @Test
    @DisplayName("Should compile Vietnamese shorthand strategy notation via regex transpiler")
    void shouldCompileVietnameseShorthandScript() {
        String script = """
                MUA KHI: sma(10) cắt lên sma(30) và rsi(14) < 65
                BÁN KHI: sma(10) cắt xuống sma(30) hoặc rsi(14) > 75
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertNotNull(ir.getEntryRule());
        assertNotNull(ir.getExitRule());
        assertEquals("AND", ir.getEntryRule().get("type"));
        assertEquals("OR", ir.getExitRule().get("type"));
        assertTrue(ir.getWarmupBarsRequired() >= 40);
    }

    @Test
    @DisplayName("Should reject empty or blank script")
    void shouldRejectEmptyScript() {
        assertThrows(ScriptCompilationException.class, () -> compiler.compile(""));
        assertThrows(ScriptCompilationException.class, () -> compiler.compile("   "));
    }

    @Test
    @DisplayName("Should reject script with unclosed string literal")
    void shouldRejectUnclosedString() {
        String script = """
                strategy("Unclosed string
                fast = ta.sma(close, 10)
                """;
        assertThrows(ScriptCompilationException.class, () -> compiler.compile(script));
    }

    @Test
    @DisplayName("Should compile full TradingView Pine Script v5 with input variables and plot calls")
    void shouldCompileTradingViewPineScriptV5WithInputsAndPlots() {
        String script = """
                //@version=5
                strategy("Moving Average Cross", overlay=true, initial_capital=10000, default_qty_value=100)

                fastLength = input.int(9, title="Fast Length", minval=1)
                slowLength = input.int(21, title="Slow Length", minval=1)
                src = input.source(close, title="Source")

                fastEMA = ta.ema(src, fastLength)
                slowEMA = ta.ema(src, slowLength)

                plot(fastEMA, color=color.blue, title="Fast EMA")
                plot(slowEMA, color=color.red, title="Slow EMA")

                longCondition = ta.crossover(fastEMA, slowEMA)
                if (longCondition)
                    strategy.entry("My Long Entry", strategy.long)

                shortCondition = ta.crossunder(fastEMA, slowEMA)
                if (shortCondition)
                    strategy.close("My Long Entry")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("Moving Average Cross", ir.getStrategyTitle());
        assertEquals(10000.0, ir.getInitialCapital());
        assertEquals(100.0, ir.getDefaultQtyValue());
        assertTrue(ir.getOverlay());
        assertEquals("CROSSED_UP", ir.getEntryRule().get("type"));
        assertEquals("CROSSED_DOWN", ir.getExitRule().get("type"));
        assertTrue(ir.getWarmupBarsRequired() >= 31);
    }

    @Test
    @DisplayName("Should compile Pine Script with MACD tuple destructuring and plots")
    void shouldCompileMacdWithTupleDestructuring() {
        String script = """
                //@version=5
                strategy("MACD Strategy", overlay=false)

                fast_length = input.int(12)
                slow_length = input.int(26)
                signal_length = input.int(9)

                [macdLine, signalLine, hist] = ta.macd(close, fast_length, slow_length, signal_length)

                plot(macdLine, color=color.blue)
                plot(signalLine, color=color.orange)

                longCondition = ta.crossover(macdLine, signalLine)
                if longCondition
                    strategy.entry("Long", strategy.long)

                shortCondition = ta.crossunder(macdLine, signalLine)
                if shortCondition
                    strategy.close("Long")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("MACD Strategy", ir.getStrategyTitle());
        assertEquals("CROSSED_UP", ir.getEntryRule().get("type"));
        assertEquals("CROSSED_DOWN", ir.getExitRule().get("type"));
        assertTrue(ir.getWarmupBarsRequired() >= 36);
    }

    @Test
    @DisplayName("Should compile Pine Script with Bollinger Bands tuple destructuring and crossover")
    void shouldCompileBollingerBandsStrategy() {
        String script = """
                //@version=5
                strategy("Bollinger Bands Strategy", overlay=true)

                length = input.int(20, minval=1)
                mult = input.float(2.0, minval=0.001, maxval=50)

                [bbBasis, bbUpper, bbLower] = ta.bb(close, length, mult)

                buySignal = ta.crossover(close, bbLower)
                sellSignal = ta.crossunder(close, bbUpper)

                if buySignal
                    strategy.entry("BB Long", strategy.long)
                if sellSignal
                    strategy.close("BB Long")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("Bollinger Bands Strategy", ir.getStrategyTitle());
        assertEquals("CROSSED_UP", ir.getEntryRule().get("type"));
        assertEquals("CROSSED_DOWN", ir.getExitRule().get("type"));
        assertTrue(ir.getWarmupBarsRequired() >= 30);
    }

    @Test
    @DisplayName("Should compile direct strategy orders with 'when' clause outside if statement")
    void shouldCompileDirectStrategyOrdersWithWhenClause() {
        String script = """
                //@version=5
                strategy("Direct When Strategy")

                fast = ta.sma(close, 10)
                slow = ta.sma(close, 30)

                strategy.entry("Long", strategy.long, when = ta.crossover(fast, slow))
                strategy.close("Long", when = ta.crossunder(fast, slow))
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("Direct When Strategy", ir.getStrategyTitle());
        assertEquals("CROSSED_UP", ir.getEntryRule().get("type"));
        assertEquals("CROSSED_DOWN", ir.getExitRule().get("type"));
    }

    @Test
    @DisplayName("Should compile Pine Script with multiline comments, hlines, and alerts")
    void shouldCompileWithCommentsAndHlinesAndAlerts() {
        String script = """
                /* 
                 * Multi-line TradingView Pine Script header
                 * Strategy: RSI Overbought / Oversold
                 */
                //@version=5
                strategy("RSI Complete", overlay=true)

                rsiLength = input.int(14, "RSI Length")
                overSold = input.float(30.0, "Oversold")
                overBought = input.float(70.0, "Overbought")

                vrsi = ta.rsi(close, rsiLength)

                hline(overSold, "Oversold Level", color=color.green)
                hline(overBought, "Overbought Level", color=color.red)

                longCondition = ta.crossover(vrsi, overSold)
                shortCondition = ta.crossunder(vrsi, overBought)

                alertcondition(longCondition, title="RSI Buy", message="RSI crossed above oversold")

                if (longCondition)
                    strategy.entry("RSI Entry", strategy.long)

                if (shortCondition)
                    strategy.close("RSI Entry")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("RSI Complete", ir.getStrategyTitle());
        assertEquals("CROSSED_UP", ir.getEntryRule().get("type"));
        assertEquals("CROSSED_DOWN", ir.getExitRule().get("type"));
    }

    @Test
    @DisplayName("Should extract start_time and end_time from strategy declaration")
    void shouldExtractDatesFromStrategyDeclaration() {
        String script = """
                //@version=5
                strategy("Dated Strategy", overlay=true, start_time="2024-01-01", end_time="2024-06-01")

                fast = ta.sma(close, 10)
                slow = ta.sma(close, 30)

                if ta.crossover(fast, slow)
                    strategy.entry("Long", strategy.long)
                if ta.crossunder(fast, slow)
                    strategy.close("Long")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("Dated Strategy", ir.getStrategyTitle());
        assertNotNull(ir.getStartTime());
        assertNotNull(ir.getEndTime());
        assertTrue(ir.getStartTime().startsWith("2024-01-01"));
        assertTrue(ir.getEndTime().startsWith("2024-06-01"));
    }

    @Test
    @DisplayName("Should extract startDate and endDate variables with timestamp() or input.time()")
    void shouldExtractDatesFromVariables() {
        String script = """
                //@version=5
                strategy("Variable Date Strategy")

                startDate = input.time(timestamp("2024-02-15"), "Start Date")
                endDate = timestamp(2024, 7, 30, 23, 59, 59)

                fast = ta.ema(close, 9)
                slow = ta.ema(close, 21)

                if ta.crossover(fast, slow)
                    strategy.entry("Buy", strategy.long)
                if ta.crossunder(fast, slow)
                    strategy.close("Buy")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertNotNull(ir.getStartTime());
        assertNotNull(ir.getEndTime());
        assertTrue(ir.getStartTime().startsWith("2024-02-15"));
        assertTrue(ir.getEndTime().startsWith("2024-07-30"));
    }

    @Test
    @DisplayName("Should extract start and end dates from directive comments")
    void shouldExtractDatesFromDirectiveComments() {
        String script = """
                //@version=5
                //@start=2024-03-01
                //@end=2024-09-01
                strategy("Directive Strategy")

                fast = ta.ema(close, 9)
                slow = ta.ema(close, 21)

                if ta.crossover(fast, slow)
                    strategy.entry("Buy", strategy.long)
                if ta.crossunder(fast, slow)
                    strategy.close("Buy")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertNotNull(ir.getStartTime());
        assertNotNull(ir.getEndTime());
        assertTrue(ir.getStartTime().startsWith("2024-03-01"));
        assertTrue(ir.getEndTime().startsWith("2024-09-01"));
    }

    @Test
    @DisplayName("Should extract start and end dates from shorthand notation (Vietnamese)")
    void shouldExtractDatesFromShorthand() {
        String script = """
                THỜI GIAN: 2024-01-01 ĐẾN 2024-05-01
                MUA KHI: ema(9) cắt lên ema(21)
                BÁN KHI: ema(9) cắt xuống ema(21)
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertNotNull(ir.getStartTime());
        assertNotNull(ir.getEndTime());
        assertTrue(ir.getStartTime().startsWith("2024-01-01"));
        assertTrue(ir.getEndTime().startsWith("2024-05-01"));
    }

    @Test
    @DisplayName("Should extract timeframe from strategy declaration")
    void shouldExtractTimeframeFromStrategyDeclaration() {
        String script = """
                //@version=5
                strategy("15m Strategy", overlay=true, timeframe="15m")

                fast = ta.ema(close, 9)
                slow = ta.ema(close, 21)

                if ta.crossover(fast, slow)
                    strategy.entry("Buy", strategy.long)
                if ta.crossunder(fast, slow)
                    strategy.close("Buy")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("15m", ir.getTimeframe());
    }

    @Test
    @DisplayName("Should extract timeframe from variable assignment with input.timeframe()")
    void shouldExtractTimeframeFromVariable() {
        String script = """
                //@version=5
                strategy("Variable TF Strategy")

                tf = input.timeframe("4h", "Timeframe")

                fast = ta.ema(close, 9)
                slow = ta.ema(close, 21)

                if ta.crossover(fast, slow)
                    strategy.entry("Buy", strategy.long)
                if ta.crossunder(fast, slow)
                    strategy.close("Buy")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("4h", ir.getTimeframe());
    }

    @Test
    @DisplayName("Should extract timeframe from directive comment")
    void shouldExtractTimeframeFromDirective() {
        String script = """
                //@version=5
                //@timeframe=1d
                strategy("Daily Strategy")

                fast = ta.ema(close, 9)
                slow = ta.ema(close, 21)

                if ta.crossover(fast, slow)
                    strategy.entry("Buy", strategy.long)
                if ta.crossunder(fast, slow)
                    strategy.close("Buy")
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("1d", ir.getTimeframe());
    }

    @Test
    @DisplayName("Should extract timeframe from shorthand notation (Vietnamese)")
    void shouldExtractTimeframeFromShorthand() {
        String script = """
                KHUNG THỜI GIAN: 15m
                THỜI GIAN: 2024-01-01 ĐẾN 2024-05-01
                MUA KHI: ema(9) cắt lên ema(21)
                BÁN KHI: ema(9) cắt xuống ema(21)
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("15m", ir.getTimeframe());
        assertNotNull(ir.getStartTime());
        assertNotNull(ir.getEndTime());
    }

    @Test
    @DisplayName("Variable assignment timeframe should override strategy declaration timeframe")
    void shouldAllowVariableToOverrideStrategyDeclaration() {
        String script = """
                //@version=5
                strategy("Test", timeframe="1h")
                timeframe = input.timeframe("1d", "Timeframe")
                fast = ta.sma(close, 10)
                slow = ta.sma(close, 30)
                if ta.crossover(fast, slow)
                    strategy.entry("Buy", strategy.long)
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("1d", ir.getTimeframe());
    }

    @Test
    @DisplayName("Directive timeframe comment should override strategy declaration timeframe")
    void shouldAllowDirectiveToOverrideStrategyDeclaration() {
        String script = """
                //@version=5
                //@timeframe=1d
                strategy("Test", timeframe="1h")
                fast = ta.sma(close, 10)
                slow = ta.sma(close, 30)
                if ta.crossover(fast, slow)
                    strategy.entry("Buy", strategy.long)
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertEquals("1d", ir.getTimeframe());
    }

    @Test
    @DisplayName("Should extract plot statements with indicator, color, and title")
    void shouldExtractPlotStatements() {
        String script = """
                //@version=5
                strategy("EMA Cross", overlay=true)
                fastLength = input.int(9, title="Fast Length")
                slowLength = input.int(21, title="Slow Length")
                src = close
                fastEMA = ta.ema(src, fastLength)
                slowEMA = ta.ema(src, slowLength)

                plot(fastEMA, color=color.blue, title="Fast EMA")
                plot(slowEMA, color=color.red, title="Slow EMA")

                if ta.crossover(fastEMA, slowEMA)
                    strategy.entry("Buy", strategy.long)
                """;

        CompiledScriptIR ir = compiler.compile(script);

        assertNotNull(ir);
        assertNotNull(ir.getPlots());
        assertEquals(2, ir.getPlots().size());

        PlotDefinition p1 = ir.getPlots().get(0);
        assertEquals("Fast EMA", p1.title());
        assertEquals("EMA", p1.indicator());
        assertEquals(9, p1.period());
        assertEquals("#3b82f6", p1.color());

        PlotDefinition p2 = ir.getPlots().get(1);
        assertEquals("Slow EMA", p2.title());
        assertEquals("EMA", p2.indicator());
        assertEquals(21, p2.period());
        assertEquals("#ef4444", p2.color());
    }
}

