import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  X,
  Minus,
  Square,
  Copy,
  ChevronDown,
  Terminal,
  FileCode,
  Sparkles,
  RefreshCw,
  Code2,
  Layers,
  HelpCircle,
  MoreHorizontal,
  PlusSquare,
  Trash2,
} from 'lucide-react';
import { scriptService, CompileScriptResponse, PlotDefinition } from '../../services/scriptService';
import { useOHLCV } from '../../context/OHLCVContext';

export interface ScriptModel {
  id?: string;
  title: string;
  sourceCode: string;
}

interface PineEditorProps {
  initialScript?: ScriptModel | null;
  dateRange?: [string, string];
  initialCapital?: number;
  onClose: () => void;
  onApplyToChart?: (strategy: {
    name: string;
    badge?: 'NEW' | 'BETA';
    scriptId?: string;
    result?: any;
    plots?: PlotDefinition[];
  }) => void;
}

const TEMPLATES: Record<string, { label: string; title: string; code: string }> = {
  'default': {
    label: 'Standard Pine Script v5 (Khung TG + Thời gian)',
    title: 'My Custom Strategy',
    code: `//@version=5
strategy("My Custom Strategy", overlay=true, initial_capital=10000, default_qty_value=100)

// 1. Cấu hình khung thời gian & thời gian chạy backtest trong code
timeframe = input.timeframe("1h", "Timeframe")
startDate = input.time(timestamp("2024-01-01"), "Start Date")
endDate = input.time(timestamp("2024-06-01"), "End Date")

// 2. Fast & Slow Lengths
fastLength = input.int(9, title="Fast Length", minval=1)
slowLength = input.int(21, title="Slow Length", minval=1)
src = input.source(close, title="Source")

// 3. Moving averages
fastEMA = ta.ema(src, fastLength)
slowEMA = ta.ema(src, slowLength)

// 4. Plot lines on chart
plot(fastEMA, color=color.blue, title="Fast EMA")
plot(slowEMA, color=color.red, title="Slow EMA")

// 5. Entry & Exit Conditions
longCondition = ta.crossover(fastEMA, slowEMA)
if (longCondition)
    strategy.entry("My Long Entry", strategy.long)

shortCondition = ta.crossunder(fastEMA, slowEMA)
if (shortCondition)
    strategy.close("My Long Entry")
`,
  },
  'rsi': {
    label: 'RSI Reversal Strategy (Comment Directives)',
    title: 'RSI Reversal Strategy',
    code: `//@version=5
//@timeframe=1h
//@start=2024-01-01
//@end=2024-06-01
strategy("RSI Reversal", overlay=true, initial_capital=10000)

length = input.int(14, "RSI Length")
overSold = input.float(30.0, "Oversold")
overBought = input.float(70.0, "Overbought")

vrsi = ta.rsi(close, length)

hline(overSold, "Oversold", color=color.green)
hline(overBought, "Overbought", color=color.red)

if ta.crossover(vrsi, overSold)
    strategy.entry("RSI Long", strategy.long)

if ta.crossunder(vrsi, overBought)
    strategy.close("RSI Long")
`,
  },
  'macd': {
    label: 'MACD Tuple Destructuring',
    title: 'MACD Strategy',
    code: `//@version=5
strategy("MACD Strategy", overlay=false, initial_capital=10000, timeframe="1h", start_time="2024-01-01", end_time="2024-06-01")

fast_length = input.int(12, "Fast Length")
slow_length = input.int(26, "Slow Length")
signal_length = input.int(9, "Signal Length")

[macdLine, signalLine, hist] = ta.macd(close, fast_length, slow_length, signal_length)

plot(macdLine, color=color.blue, title="MACD Line")
plot(signalLine, color=color.orange, title="Signal Line")

if ta.crossover(macdLine, signalLine)
    strategy.entry("MACD Long", strategy.long)

if ta.crossunder(macdLine, signalLine)
    strategy.close("MACD Long")
`,
  },
  'bb': {
    label: 'Bollinger Bands Strategy',
    title: 'Bollinger Bands Strategy',
    code: `//@version=5
strategy("Bollinger Bands Strategy", overlay=true, initial_capital=10000, timeframe="1h", start_time="2024-01-01", end_time="2024-06-01")

length = input.int(20, "BB Length")
mult = input.float(2.0, "Multiplier")

[bbBasis, bbUpper, bbLower] = ta.bb(close, length, mult)

if ta.crossover(close, bbLower)
    strategy.entry("BB Long", strategy.long)

if ta.crossunder(close, bbUpper)
    strategy.close("BB Long")
`,
  },
  'vi_shorthand': {
    label: 'Ngôn Ngữ Rút Gọn (Tiếng Việt)',
    title: 'Chiến Lược Rút Gọn',
    code: `// Cú pháp siêu ngắn gọn bằng Tiếng Việt (hỗ trợ khung thời gian & thời gian chạy)
KHUNG THỜI GIAN: 1h
THỜI GIAN: 2024-01-01 ĐẾN 2024-06-01
MUA KHI: sma(10) cắt lên sma(30) và rsi(14) < 65
BÁN KHI: sma(10) cắt xuống sma(30) hoặc rsi(14) > 75
`,
  },
  'en_shorthand': {
    label: 'Shorthand Notation (English)',
    title: 'English Shorthand Strategy',
    code: `// Concise trading strategy notation with timeframe & period
TIMEFRAME: 1h
PERIOD: 2024-01-01 TO 2024-06-01
BUY: ema(9) cross_up ema(21) and rsi(14) < 70
SELL: ema(9) cross_down ema(21) or rsi(14) > 80
`,
  },
};

export function PineEditor({ initialScript, dateRange, initialCapital, onClose, onApplyToChart }: PineEditorProps) {
  const {
    symbol,
    interval,
    setInterval,
    setActiveStrategyName,
    setBacktestResultForStrategy,
    setIsBacktestRunning,
  } = useOHLCV();

  const [scriptId, setScriptId] = useState<string | undefined>(initialScript?.id);
  const [scriptTitle, setScriptTitle] = useState<string>(
    initialScript?.title || 'Untitled script'
  );
  const [code, setCode] = useState<string>(
    initialScript?.sourceCode || TEMPLATES['default'].code
  );

  // Editor states
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileScriptResponse | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [activeLine, setActiveLine] = useState(1);
  const [activeCol, setActiveCol] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (initialScript) {
      setScriptId(initialScript.id);
      setScriptTitle(initialScript.title || 'Untitled script');
      if (initialScript.sourceCode) {
        setCode(initialScript.sourceCode);
      } else {
        setCode(TEMPLATES['default'].code);
      }
    }
  }, [initialScript]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Line numbers calculation
  const lineCount = useMemo(() => {
    return Math.max(code.split('\n').length, 18);
  }, [code]);

  // Handle cursor position updates
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, pos);
    const lines = textBefore.split('\n');
    setActiveLine(lines.length);
    setActiveCol(lines[lines.length - 1].length + 1);
  };

  // Sync scrolling between line numbers gutter and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Tab key indents with 4 spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart ?? 0;
      const end = textareaRef.current?.selectionEnd ?? 0;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          updateCursorPosition();
        }
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveScript();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunAndApply();
    }
  };

  // Dry-run compile check
  const handleCompile = async (): Promise<CompileScriptResponse | null> => {
    setIsCompiling(true);
    setStatusMessage('Compiling Pine Script…');
    try {
      const res = await scriptService.compile(code);
      setCompileResult(res);
      if (res.success) {
        let msg = `Compiled successfully (${res.strategyTitle || 'Strategy'})`;
        if (res.timeframe) {
          msg += ` | ⏱ Khung: ${res.timeframe}`;
        }
        if (res.startTime || res.endTime) {
          msg += ` | 🕒 ${res.startTime ? res.startTime.substring(0, 10) : 'Tùy chỉnh'} → ${res.endTime ? res.endTime.substring(0, 10) : 'Nay'}`;
        }
        setStatusMessage(msg);
        if (res.strategyTitle && scriptTitle === 'Untitled script') {
          setScriptTitle(res.strategyTitle);
        }
        return res;
      } else {
        setStatusMessage(`Error at line ${res.line || 1}: ${res.error || 'Compile error'}`);
        setConsoleOpen(true);
        return null;
      }
    } catch (err: any) {
      setStatusMessage(`Compilation failed: ${err.message || 'Network error'}`);
      setCompileResult({
        success: false,
        error: err.message || 'Network connection failed',
      });
      setConsoleOpen(true);
      return null;
    } finally {
      setIsCompiling(false);
    }
  };

  // Save or Update Script in backend
  const handleSaveScript = async () => {
    setIsSaving(true);
    setStatusMessage('Saving script to Cloud…');
    try {
      if (scriptId) {
        const updated = await scriptService.updateScript(scriptId, scriptTitle, code);
        setStatusMessage(`Saved version ${updated.latestVersion}!`);
      } else {
        const created = await scriptService.createScript(scriptTitle, code);
        setScriptId(created.id);
        setStatusMessage('Created & saved new script!');
      }
    } catch (err: any) {
      setStatusMessage(`Save failed: ${err.message || 'Cannot save script'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Play button: Compile + Execute Backtest + Add to Chart!
  const handleRunAndApply = async () => {
    const compiled = await handleCompile();
    if (!compiled || !compiled.success) return;

    setIsRunning(true);
    setIsBacktestRunning(true);

    const cleanSymbol = (symbol || 'BTCUSDT').replace('/', '').toUpperCase();

    // Check if user configured timeframe or backtest time directly in their script
    const scriptTf = compiled.timeframe;
    const cleanTf = scriptTf || (interval || '1h').toLowerCase();

    const scriptStart = compiled.startTime;
    const scriptEnd = compiled.endTime;
    const startIso = scriptStart || (dateRange?.[0] ? `${dateRange[0]}T00:00:00Z` : '2024-01-01T00:00:00Z');
    const endIso = scriptEnd || (dateRange?.[1] ? `${dateRange[1]}T23:59:59Z` : new Date().toISOString());
    const cap = initialCapital || 10000.0;

    let runMsg = 'Dispatching backtest to engine…';
    if (scriptStart || scriptEnd || scriptTf) {
      runMsg = `🕒 Chạy theo code: ${cleanTf}${scriptStart || scriptEnd ? ` | ${startIso.substring(0, 10)} → ${endIso.substring(0, 10)}` : ''}…`;
    }
    setStatusMessage(runMsg);

    // Sync chart interval immediately if script configured a different timeframe
    if (cleanTf && cleanTf !== interval) {
      setInterval(cleanTf);
    }

    try {
      // 1. Submit direct backtest
      const job = await scriptService.runDirect({
        sourceCode: code,
        symbol: cleanSymbol,
        timeframe: cleanTf,
        startTime: startIso,
        endTime: endIso,
        initialCapital: cap,
      });

      const jobId = job.id || job.jobId;
      if (!jobId) {
        throw new Error('No job ID returned from engine');
      }

      setStatusMessage(`Job ${jobId.substring(0, 8)} running…`);

      // 2. Poll until completed
      const finalJob = await scriptService.pollJobUntilDone(jobId, (j) => {
        setStatusMessage(`Job ${j.status.toLowerCase()}…`);
      });

      if (finalJob.status === 'COMPLETED' && (finalJob.result || finalJob.resultPayload)) {
        let backtestData: any = finalJob.result;
        if (!backtestData && finalJob.resultPayload) {
          try {
            backtestData = JSON.parse(finalJob.resultPayload);
          } catch {}
        }

        if (backtestData && Array.isArray(backtestData.trades)) {
          const stratName = scriptTitle.trim() || compiled.strategyTitle || 'Pine Script Strategy';

          backtestData.symbol = cleanSymbol;
          backtestData.timeframe = cleanTf;
          if (!backtestData.startTime) backtestData.startTime = startIso;
          if (!backtestData.endTime) backtestData.endTime = endIso;

          // 0. Ensure chart interval matches backtest timeframe
          if (cleanTf && cleanTf !== interval) {
            setInterval(cleanTf);
          }

          // 1. Set result in OHLCV context under this strategy name
          setBacktestResultForStrategy(stratName, backtestData);

          // 2. Make this strategy active
          setActiveStrategyName(stratName);

          // 3. Notify parent to add to strategies list and expand strategy bar
          onApplyToChart?.({
            name: stratName,
            badge: 'NEW',
            scriptId,
            result: backtestData,
            plots: compiled.plots,
          });

          const count = backtestData.trades.length;
          const ret = backtestData.metrics?.totalReturnPercent != null
            ? ` | Return: ${backtestData.metrics.totalReturnPercent.toFixed(2)}%`
            : '';
          setStatusMessage(`Calculated ${count} entry & exit trades${ret}`);
        } else {
          setStatusMessage('Backtest completed but returned 0 trades');
        }
      } else {
        setStatusMessage(`Job failed: ${finalJob.errorMessage || 'Execution error'}`);
        setConsoleOpen(true);
      }
    } catch (err: any) {
      console.error('[PineEditor] Run error:', err);
      setStatusMessage(`Run error: ${err.message || 'Execution error'}`);
      setConsoleOpen(true);
    } finally {
      setIsRunning(false);
      setIsBacktestRunning(false);
    }
  };

  const handleSelectTemplate = (key: string) => {
    const t = TEMPLATES[key];
    if (!t) return;
    if (confirm(`Thay thế mã hiện tại bằng mẫu "${t.label}"?`)) {
      setCode(t.code);
      setScriptTitle(t.title);
      setTemplateMenuOpen(false);
      setCompileResult(null);
      setStatusMessage('Template loaded');
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#131722] text-[#d1d4dc] border-l border-[#2a2e39] font-sans overflow-hidden transition-all duration-150 select-none ${
        isMaximized
          ? 'fixed inset-0 z-[120] bg-[#131722]'
          : 'h-full w-full'
      }`}
    >
      {/* 1. Header (TradingView Style: [+] Pine Editor | - □ X) */}
      <div className="flex items-center justify-between px-3 h-9 bg-[#1e222d] border-b border-[#2a2e39] shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-gray-200 font-semibold">
            <PlusSquare className="size-3.5 text-gray-400" />
            <span>Pine Editor</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 text-gray-400">
          <button
            onClick={() => onClose()}
            title="Minimize"
            className="p-1 hover:bg-[#2a2e39] hover:text-white rounded transition-colors cursor-pointer"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore down' : 'Maximize'}
            className="p-1 hover:bg-[#2a2e39] hover:text-white rounded transition-colors cursor-pointer"
          >
            <Square className="size-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close editor"
            className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Subheader Toolbar (Matches TradingView: ~ Untitled script ∨ | ▷ ☁ ⚠️ ...) */}
      <div className="flex items-center justify-between px-3 h-10 bg-[#131722] border-b border-[#2a2e39] shrink-0 text-xs">
        <div className="flex items-center gap-2">
          {/* Script title with TradingView ~ and chevron */}
          <div className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1e222d] transition-colors text-gray-200 group">
            <span className="text-gray-400 font-mono text-sm leading-none">~</span>
            <input
              type="text"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-100 focus:outline-none w-36 sm:w-48 placeholder-gray-500"
              placeholder="Untitled script"
            />
            <button
              onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
              title="Templates"
              className="p-0.5 hover:bg-[#2a2e39] rounded cursor-pointer"
            >
              <ChevronDown className="size-3.5 text-gray-400 group-hover:text-gray-200" />
            </button>
          </div>

          {/* Quick template popup if chevron clicked */}
          {templateMenuOpen && (
            <div className="absolute left-6 top-20 w-64 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#2a2e39]">
                Choose Template
              </div>
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#2962ff]/20 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: ▷ (Play/Run) | ☁ (Cloud Save) | ⚠️ (Diagnostics) | ... (More) */}
        <div className="flex items-center gap-2">
          {/* Play / Run Button: ▷ */}
          <button
            onClick={handleRunAndApply}
            disabled={isRunning || isCompiling}
            title="Add to chart / Execute backtest (Ctrl+Enter)"
            className="p-1.5 hover:bg-[#2a2e39] active:scale-95 text-blue-400 hover:text-blue-300 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="size-4 animate-spin text-blue-400" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </button>

          {/* Cloud Save Button: ☁ */}
          <button
            onClick={handleSaveScript}
            disabled={isSaving}
            title="Save script to Cloud (Ctrl+S)"
            className="p-1.5 hover:bg-[#2a2e39] active:scale-95 text-gray-300 hover:text-white rounded transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="size-4 animate-spin text-blue-400" />
            ) : (
              <Cloud className="size-4" />
            )}
          </button>

          {/* Compile Status / Warning Icon: ⚠️ */}
          <button
            onClick={() => handleCompile()}
            disabled={isCompiling}
            title={
              compileResult?.valid === false
                ? compileResult.error || 'Compiler error'
                : 'Compile / Check diagnostics'
            }
            className="p-1.5 hover:bg-[#2a2e39] rounded transition-colors cursor-pointer"
          >
            {isCompiling ? (
              <RefreshCw className="size-4 animate-spin text-blue-400" />
            ) : compileResult?.valid === false ? (
              <AlertTriangle className="size-4 text-rose-500" />
            ) : compileResult?.valid === true ? (
              <CheckCircle2 className="size-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="size-4 text-gray-400 hover:text-amber-400" />
            )}
          </button>

          {/* More actions dropdown: ... */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              title="More actions"
              className="p-1.5 hover:bg-[#2a2e39] text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#2a2e39]">
                  Strategy Templates
                </div>
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => {
                      handleSelectTemplate(key);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#2962ff]/20 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
                <div className="border-t border-[#2a2e39] my-1" />
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(code);
                    setStatusMessage('Code copied to clipboard!');
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#2962ff]/20 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  <span>Copy source code</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear editor?')) {
                      setCode('//@version=5\nstrategy("Untitled")\n');
                      setMoreMenuOpen(false);
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Clear editor</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Editor Body (Line Numbers + Code Canvas) */}
      <div className="flex-1 relative flex overflow-hidden bg-[#131722]">
        {/* Line numbers gutter */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 pr-2 text-right font-mono text-xs select-none bg-[#131722] text-[#50535e] border-r border-[#2a2e39] overflow-hidden"
          style={{ lineHeight: '1.45rem' }}
        >
          {Array.from({ length: lineCount }).map((_, idx) => {
            const lineNum = idx + 1;
            const isCur = lineNum === activeLine;
            return (
              <div
                key={lineNum}
                className={isCur ? 'text-gray-200 font-semibold bg-[#2a2e39]/40' : ''}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Code Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              updateCursorPosition();
            }}
            onScroll={handleScroll}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="size-full p-3 font-mono text-[13px] text-[#d1d4dc] bg-transparent resize-none focus:outline-none selection:bg-[#2962ff]/40 selection:text-white caret-[#2962ff] overflow-auto whitespace-pre"
            style={{
              lineHeight: '1.45rem',
              tabSize: 4,
            }}
          />
        </div>
      </div>

      {/* 4. Console Drawer (Collapsible) */}
      {consoleOpen && (
        <div className="h-44 bg-[#181b24] border-t border-[#2a2e39] flex flex-col text-xs font-mono select-text">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e222d] border-b border-[#2a2e39]">
            <div className="flex items-center gap-2 text-gray-300">
              <Terminal className="size-3.5 text-emerald-400" />
              <span className="font-semibold text-gray-200">Pine Script Diagnostics & IR</span>
            </div>
            <button
              onClick={() => setConsoleOpen(false)}
              className="p-1 hover:bg-[#2a2e39] text-gray-400 hover:text-white rounded cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-gray-300">
            {compileResult?.success ? (
              <div className="space-y-1.5">
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>Compiled Successfully: {compileResult.strategyTitle}</span>
                </div>
                <div className="text-gray-400 text-[11px] grid grid-cols-2 gap-2">
                  <div>Required Warmup: {compileResult.warmupBarsRequired} bars</div>
                  <div>AST Complexity: {compileResult.complexityScore} nodes</div>
                  {(compileResult.timeframe || compileResult.startTime || compileResult.endTime) && (
                    <div className="col-span-2 text-amber-300 flex flex-wrap items-center gap-3 font-mono bg-[#131722] p-1.5 rounded border border-amber-800/40">
                      {compileResult.timeframe && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">⏱ Khung thời gian:</span>
                          <span className="font-semibold text-emerald-300">{compileResult.timeframe}</span>
                        </div>
                      )}
                      {(compileResult.startTime || compileResult.endTime) && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">🕒 Thời gian:</span>
                          <span className="font-semibold text-emerald-300">
                            {compileResult.startTime ? compileResult.startTime.substring(0, 10) : 'Tùy chỉnh'} → {compileResult.endTime ? compileResult.endTime.substring(0, 10) : 'Nay'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="col-span-2">Source SHA-256: {compileResult.sourceHash}</div>
                </div>
                {compileResult.entryRule && (
                  <div className="p-2 bg-[#131722] rounded border border-[#2a2e39] text-[11px] text-blue-300 font-mono">
                    <span className="text-gray-400">Entry Rule: </span>
                    {JSON.stringify(compileResult.entryRule)}
                  </div>
                )}
                {compileResult.exitRule && (
                  <div className="p-2 bg-[#131722] rounded border border-[#2a2e39] text-[11px] text-amber-300 font-mono">
                    <span className="text-gray-400">Exit Rule: </span>
                    {JSON.stringify(compileResult.exitRule)}
                  </div>
                )}
              </div>
            ) : compileResult?.error ? (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 text-xs">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="size-3.5 text-rose-400" />
                  <span>Compilation Error:</span>
                </div>
                <div>{compileResult.error}</div>
                {compileResult.line && (
                  <div className="mt-1 text-rose-400 font-mono text-[11px]">
                    Location: Line {compileResult.line}, Col {compileResult.column || 1}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 py-4 text-center">
                Press "Add to chart" or compile to view strategy IR structure.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Status Bar at Bottom */}
      <div className="flex items-center justify-between px-3 h-6 bg-[#181b24] border-t border-[#2a2e39] text-[11px] text-gray-400 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConsoleOpen(!consoleOpen)}
            className="flex items-center gap-1 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <Terminal className="size-3 text-gray-500" />
            <span>Console</span>
          </button>
          <span className="text-gray-600">|</span>
          <span className={statusMessage.includes('Error') ? 'text-rose-400' : 'text-gray-400'}>
            {statusMessage}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Line {activeLine}, Col {activeCol}
          </span>
          <span className="text-gray-600">|</span>
          <span>Pine Script v5</span>
        </div>
      </div>
    </div>
  );
}
export default PineEditor;
