const API_BASE = 'http://127.0.0.1:8000/api';

const sampleData = [
    { time: '2024-01-01', open: 100, high: 105, low: 98, close: 102, volume: 500 },
    { time: '2024-01-02', open: 102, high: 108, low: 101, close: 107, volume: 620 },
    { time: '2024-01-03', open: 107, high: 110, low: 105, close: 106, volume: 580 },
    { time: '2024-01-04', open: 106, high: 109, low: 104, close: 108, volume: 610 },
    { time: '2024-01-05', open: 108, high: 112, low: 107, close: 111, volume: 700 },
];

const state = {
    symbol: 'TSLA',
    timeframe: '5min',
    chartType: 'candlestick',
    indicators: new Set(),
    candles: [],
    strategies: [],
    activeStrategy: null,
};

const chart = LightweightCharts.createChart(document.getElementById('chart'), {
    width: document.getElementById('chart').parentElement.clientWidth,
    height: document.getElementById('chart').parentElement.clientHeight,
    layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#e8edf7',
        fontSize: 12,
    },
    grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
    },
    rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.08)' },
    timeScale: { borderColor: 'rgba(255, 255, 255, 0.08)', timeVisible: true, secondsVisible: false },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
});

let candleSeries = null;
let overlaySeries = [];

function log(message) {
    const container = document.getElementById('activityLog');
    const timestamp = new Date().toLocaleTimeString();
    container.innerHTML = `<div>[${timestamp}] ${message}</div>` + container.innerHTML;
}

function updateStatus() {
    document.getElementById('statusSymbol').textContent = state.symbol;
    document.getElementById('statusTimeframe').textContent = state.timeframe;
    document.getElementById('statusBars').textContent = String(state.candles.length);
    document.getElementById('statusStrategy').textContent = state.activeStrategy?.name ?? 'n/a';
}

function setSummary(summary) {
    const panel = document.getElementById('summaryPanel');
    panel.innerHTML = [
        ['Total return', formatPercent(summary.total_return)],
        ['Max drawdown', formatPercent(summary.max_drawdown)],
        ['Sharpe', summary.sharpe_ratio?.toFixed?.(2) ?? '--'],
        ['Trades', String(summary.trade_count ?? '--')],
    ].map(([label, value]) => `<div class="metric"><strong>${label}</strong><span>${value}</span></div>`).join('');
}

function formatPercent(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '--';
    }
    const numeric = Number(value);
    return `${(numeric * 100).toFixed(2)}%`;
}

function clearOverlays() {
    overlaySeries.forEach(series => chart.removeSeries(series));
    overlaySeries = [];
}

function renderCandles(data) {
    clearOverlays();

    if (candleSeries) {
        chart.removeSeries(candleSeries);
    }

    candleSeries = chart.addCandlestickSeries({
        upColor: '#27d3a2',
        downColor: '#ff6b6b',
        borderVisible: false,
        wickUpColor: '#27d3a2',
        wickDownColor: '#ff6b6b',
    });

    candleSeries.setData(data.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
    })));
    chart.timeScale().fitContent();
}

function renderLine(data) {
    clearOverlays();

    if (candleSeries) {
        chart.removeSeries(candleSeries);
    }

    candleSeries = chart.addLineSeries({ color: '#4ea1ff', lineWidth: 2 });
    candleSeries.setData(data.map(item => ({ time: item.time, value: item.close })));
    chart.timeScale().fitContent();
}

function renderArea(data) {
    clearOverlays();

    if (candleSeries) {
        chart.removeSeries(candleSeries);
    }

    candleSeries = chart.addAreaSeries({
        topColor: 'rgba(78, 161, 255, 0.28)',
        bottomColor: 'rgba(78, 161, 255, 0.04)',
        lineColor: '#4ea1ff',
        lineWidth: 2,
    });
    candleSeries.setData(data.map(item => ({ time: item.time, value: item.close })));
    chart.timeScale().fitContent();
}

async function fetchJSON(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

function normalizeRows(rows) {
    return rows
        .map(row => ({
            time: row.time || row.date || row.timestamp,
            open: Number(row.open),
            high: Number(row.high),
            low: Number(row.low),
            close: Number(row.close),
            volume: Number(row.volume ?? 0),
        }))
        .filter(row => row.time && Number.isFinite(row.close));
}

async function loadMarket() {
    const symbol = document.getElementById('symbolInput').value.trim().toUpperCase() || state.symbol;
    const timeframe = document.getElementById('timeframeSelect').value;

    state.symbol = symbol;
    state.timeframe = timeframe;
    updateStatus();

    try {
        const payload = await fetchJSON(`${API_BASE}/market`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, timeframe }),
        });

        state.candles = normalizeRows(payload.data.rows);
        log(`Loaded ${state.candles.length} bars for ${symbol} ${timeframe}`);
    } catch (error) {
        state.candles = sampleData;
        log(`Backend unavailable, using sample candles for ${symbol}`);
    }

    if (state.chartType === 'line') {
        renderLine(state.candles);
    } else if (state.chartType === 'area') {
        renderArea(state.candles);
    } else {
        renderCandles(state.candles);
    }

    await loadWatchlist();
    updateStatus();
}

async function loadWatchlist() {
    const container = document.getElementById('watchlist');
    try {
        const payload = await fetchJSON(`${API_BASE}/symbols`);
        const symbols = payload.data.symbols.length ? payload.data.symbols : [state.symbol];
        container.innerHTML = symbols.map(symbol => `
            <button class="symbol-item ${symbol === state.symbol ? 'active' : ''}" data-symbol="${symbol}">
                <span>${symbol}</span><span>›</span>
            </button>
        `).join('');
        container.querySelectorAll('[data-symbol]').forEach(button => {
            button.addEventListener('click', async () => {
                document.getElementById('symbolInput').value = button.dataset.symbol;
                await loadMarket();
            });
        });
    } catch (error) {
        container.innerHTML = `<div class="metric"><strong>No backend data</strong><div>Using manual symbol input only.</div></div>`;
    }
}

async function loadStrategies() {
    const select = document.getElementById('strategySelect');
    const notes = document.getElementById('strategyNotes');
    try {
        const payload = await fetchJSON(`${API_BASE}/strategies`);
        state.strategies = payload.data.strategies;
        select.innerHTML = state.strategies.map(strategy => `<option value="${strategy.strategy_id}">${strategy.name}</option>`).join('');
        state.activeStrategy = state.strategies[0] || null;
        select.value = state.activeStrategy?.strategy_id || '';
        notes.textContent = state.activeStrategy
            ? `${state.activeStrategy.description} Parameters: ${JSON.stringify(state.activeStrategy.parameters)}`
            : 'No strategy available';
    } catch (error) {
        state.strategies = [{ strategy_id: 'sma_cross', name: 'SMA Cross', description: 'Default strategy', parameters: { fast: 20, slow: 50 } }];
        select.innerHTML = '<option value="sma_cross">SMA Cross</option>';
        state.activeStrategy = state.strategies[0];
        notes.textContent = 'Backend offline. Using local default strategy.';
    }
    updateStatus();
}

async function runBacktest() {
    const strategyId = document.getElementById('strategySelect').value || state.activeStrategy?.strategy_id || 'sma_cross';
    const payload = {
        symbol: state.symbol,
        timeframe: state.timeframe,
        strategy_id: strategyId,
        initial_cash: 100000,
        fee: 0.0005,
        slippage: 0.0002,
        direction: 'both',
        params: [],
    };

    try {
        const response = await fetchJSON(`${API_BASE}/backtests/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        setSummary(response.data.summary);
        log(`Backtest completed: ${response.data.summary.trade_count} trades`);
    } catch (error) {
        setSummary({ total_return: 0, max_drawdown: 0, sharpe_ratio: 0, trade_count: 0 });
        log('Backtest API unavailable, summary reset to zero.');
    }
}

function addOverlay(kind) {
    if (!state.candles.length) {
        return;
    }

    const existing = overlaySeries.find(series => series.kind === kind);
    if (existing) {
        chart.removeSeries(existing.series);
        overlaySeries = overlaySeries.filter(series => series.kind !== kind);
        log(`Removed ${kind.toUpperCase()}`);
        return;
    }

    const values = state.candles.map((row, index, array) => {
        if (kind === 'sma20') {
            const slice = array.slice(Math.max(0, index - 19), index + 1);
            return { time: row.time, value: slice.reduce((sum, item) => sum + item.close, 0) / slice.length };
        }
        if (kind === 'sma50') {
            const slice = array.slice(Math.max(0, index - 49), index + 1);
            return { time: row.time, value: slice.reduce((sum, item) => sum + item.close, 0) / slice.length };
        }
        if (kind === 'vwap') {
            const slice = array.slice(0, index + 1);
            const volSum = slice.reduce((sum, item) => sum + item.volume, 0) || 1;
            const priceVol = slice.reduce((sum, item) => sum + ((item.high + item.low + item.close) / 3) * item.volume, 0);
            return { time: row.time, value: priceVol / volSum };
        }
        return { time: row.time, value: row.close };
    });

    const palette = {
        sma20: '#f5b942',
        sma50: '#8b5cf6',
        vwap: '#27d3a2',
        rsi14: '#ff6b6b',
    };

    const series = kind === 'rsi14'
        ? chart.addLineSeries({ color: palette[kind], lineWidth: 2 })
        : chart.addLineSeries({ color: palette[kind], lineWidth: 2 });

    series.setData(values);
    overlaySeries.push({ kind, series });
    chart.timeScale().fitContent();
    log(`Added ${kind.toUpperCase()}`);
}

function setChartType(type) {
    state.chartType = type;
    if (type === 'line') {
        renderLine(state.candles);
    } else if (type === 'area') {
        renderArea(state.candles);
    } else {
        renderCandles(state.candles);
    }
    log(`Switched to ${type} chart`);
}

function bindUI() {
    document.getElementById('loadButton').addEventListener('click', loadMarket);
    document.getElementById('backtestButton').addEventListener('click', runBacktest);
    document.getElementById('toggleLineButton').addEventListener('click', () => setChartType('line'));
    document.getElementById('toggleAreaButton').addEventListener('click', () => setChartType('area'));
    document.getElementById('toggleCandleButton').addEventListener('click', () => setChartType('candlestick'));
    document.getElementById('resetButton').addEventListener('click', () => chart.timeScale().fitContent());
    document.getElementById('sma20Button').addEventListener('click', () => addOverlay('sma20'));
    document.getElementById('sma50Button').addEventListener('click', () => addOverlay('sma50'));
    document.getElementById('vwapButton').addEventListener('click', () => addOverlay('vwap'));
    document.getElementById('rsiButton').addEventListener('click', () => addOverlay('rsi14'));
    document.getElementById('strategySelect').addEventListener('change', event => {
        const selected = state.strategies.find(strategy => strategy.strategy_id === event.target.value);
        state.activeStrategy = selected || null;
        document.getElementById('strategyNotes').textContent = selected
            ? `${selected.description} Parameters: ${JSON.stringify(selected.parameters)}`
            : 'No strategy selected';
        updateStatus();
    });
    window.addEventListener('resize', () => {
        chart.resize(document.getElementById('chart').parentElement.clientWidth, document.getElementById('chart').parentElement.clientHeight);
    });
}

async function bootstrap() {
    bindUI();
    await loadStrategies();
    await loadWatchlist();
    await loadMarket();
    document.getElementById('summaryPanel').innerHTML = [
        ['Total return', '--'],
        ['Max drawdown', '--'],
        ['Sharpe', '--'],
        ['Trades', '--'],
    ].map(([label, value]) => `<div class="metric"><strong>${label}</strong><span>${value}</span></div>`).join('');
    log('Dashboard ready');
}

bootstrap();

// Xử lý responsive
window.addEventListener('resize', () => {
    const container = document.getElementById('chart').parentElement;
    chart.applyOptions({ 
        width: container.clientWidth,
        height: 500 
    });
});
