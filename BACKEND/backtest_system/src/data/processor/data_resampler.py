"""Resampling utilities for OHLCV data."""

from __future__ import annotations

from typing import Dict

import pandas as pd


class DataResampler:
    """Resample vectorbt-ready OHLCV data between timeframes."""

    def resample(self, df: pd.DataFrame, rule: str) -> pd.DataFrame:
        """Resample OHLCV data using standard aggregation rules."""
        if df is None or df.empty:
            return df.copy() if df is not None else pd.DataFrame()

        frame = df.copy()
        if not isinstance(frame.index, pd.DatetimeIndex):
            if "timestamp" not in frame.columns:
                raise ValueError("Resampling requires a DatetimeIndex or timestamp column")
            frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="coerce")
            frame = frame.set_index("timestamp")

        frame = frame.sort_index()
        ohlcv_agg: Dict[str, str] = {
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
            "volume": "sum",
        }
        extra_columns = [column for column in frame.columns if column not in ohlcv_agg]
        for column in extra_columns:
            ohlcv_agg[column] = "last"

        resampled = frame.resample(rule).agg(ohlcv_agg)
        resampled = resampled.dropna(subset=["open", "high", "low", "close"])
        resampled.index.name = "timestamp"
        return resampled
