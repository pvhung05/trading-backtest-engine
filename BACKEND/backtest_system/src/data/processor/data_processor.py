"""Market data processing utilities.

Responsibilities:
- Normalize columns
- Validate OHLCV structure
- Clean invalid rows
- Normalize timestamps
- Sort timestamps
- Remove duplicate timestamps
- Handle missing values
- Produce vectorbt-ready DataFrames
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class ProcessingResult:
    """Metadata for processing operations."""

    rows_before: int
    rows_after: int
    duplicates_removed: int
    invalid_rows_removed: int
    missing_values_handled: int


class DataProcessor:
    """Clean and normalize market data for backtesting."""

    REQUIRED_COLUMNS = ["timestamp", "open", "high", "low", "close", "volume"]

    def __init__(self, handle_missing: str = "forward_fill"):
        self.handle_missing = handle_missing.strip().lower()
        if self.handle_missing not in {"forward_fill", "drop", "interpolate"}:
            raise ValueError("handle_missing must be one of: forward_fill, drop, interpolate")

    def process(self, df: pd.DataFrame) -> pd.DataFrame:
        """Return a vectorbt-ready DataFrame with a normalized DatetimeIndex."""
        if df is None or df.empty:
            return self._empty_frame()

        frame = self._prepare_frame(df)
        frame = self._convert_numeric_columns(frame)
        frame = self._remove_invalid_rows(frame)
        frame = self._handle_missing_values(frame)
        frame = self._finalize(frame)
        return frame

    def process_with_metadata(self, df: pd.DataFrame) -> tuple[pd.DataFrame, ProcessingResult]:
        """Process data and return a detailed summary."""
        rows_before = 0 if df is None else len(df)
        frame = self.process(df)
        rows_after = len(frame)
        duplicates_removed = 0 if df is None else max(rows_before - len(self._prepare_frame(df)), 0)
        return frame, ProcessingResult(
            rows_before=rows_before,
            rows_after=rows_after,
            duplicates_removed=duplicates_removed,
            invalid_rows_removed=max(rows_before - rows_after - duplicates_removed, 0),
            missing_values_handled=0,
        )

    def _prepare_frame(self, df: pd.DataFrame) -> pd.DataFrame:
        frame = df.copy()
        if isinstance(frame.index, pd.DatetimeIndex):
            frame = frame.reset_index().rename(columns={frame.index.name or "index": "timestamp"})
        elif "timestamp" not in frame.columns:
            frame = frame.reset_index()
            if "timestamp" not in frame.columns and len(frame.columns) > 0:
                frame = frame.rename(columns={frame.columns[0]: "timestamp"})

        frame.columns = [str(col).strip().lower() for col in frame.columns]
        if "timestamp" not in frame.columns:
            raise ValueError("timestamp column not found")

        frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="coerce")
        frame = frame[frame["timestamp"].notna()]
        frame = frame.sort_values("timestamp")
        frame = frame.drop_duplicates(subset=["timestamp"], keep="last")
        frame = frame.reset_index(drop=True)

        missing = [column for column in self.REQUIRED_COLUMNS if column not in frame.columns]
        if missing:
            raise ValueError(f"Missing columns: {missing}")

        return frame

    def _convert_numeric_columns(self, frame: pd.DataFrame) -> pd.DataFrame:
        result = frame.copy()
        for column in ["open", "high", "low", "close", "volume"]:
            result[column] = pd.to_numeric(result[column], errors="coerce")
        return result

    def _remove_invalid_rows(self, frame: pd.DataFrame) -> pd.DataFrame:
        result = frame.copy()
        valid_mask = (
            result[["open", "high", "low", "close"]].notna().all(axis=1)
            & result["volume"].notna()
            & (result["open"] > 0)
            & (result["high"] > 0)
            & (result["low"] > 0)
            & (result["close"] > 0)
            & (result["volume"] >= 0)
            & (result["high"] >= result[["open", "low", "close"]].max(axis=1))
            & (result["low"] <= result[["open", "high", "close"]].min(axis=1))
        )
        return result.loc[valid_mask].copy()

    def _handle_missing_values(self, frame: pd.DataFrame) -> pd.DataFrame:
        result = frame.copy()
        if self.handle_missing == "forward_fill":
            result = result.ffill().bfill()
        elif self.handle_missing == "interpolate":
            numeric_columns = result.select_dtypes(include=[np.number]).columns
            result[numeric_columns] = result[numeric_columns].interpolate(method="linear")
            result = result.ffill().bfill()
        elif self.handle_missing == "drop":
            result = result.dropna()
        return result

    def _finalize(self, frame: pd.DataFrame) -> pd.DataFrame:
        result = frame.copy()
        result = result.sort_values("timestamp")
        result = result.drop_duplicates(subset=["timestamp"], keep="last")
        result = result.set_index("timestamp")
        result.index = pd.DatetimeIndex(pd.to_datetime(result.index, errors="coerce"), name="timestamp")
        result = result[~result.index.isna()]
        result.columns = [str(col).strip().lower() for col in result.columns]
        return result

    def _empty_frame(self) -> pd.DataFrame:
        frame = pd.DataFrame(columns=[column for column in self.REQUIRED_COLUMNS if column != "timestamp"])
        frame.index = pd.DatetimeIndex([], name="timestamp")
        return frame

    def get_statistics(self, df: pd.DataFrame) -> Dict[str, object]:
        """Return useful summary statistics for diagnostics."""
        if df is None or df.empty:
            return {"rows": 0, "date_range": None, "missing_values": {}, "price_range": {}, "volume": {}}

        frame = df.copy()
        if not isinstance(frame.index, pd.DatetimeIndex) and "timestamp" in frame.columns:
            frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="coerce")
            frame = frame.set_index("timestamp")

        return {
            "rows": len(frame),
            "date_range": f"{frame.index.min()} to {frame.index.max()}",
            "missing_values": frame.isna().sum().to_dict(),
            "price_range": {
                "open": (frame["open"].min(), frame["open"].max()),
                "high": (frame["high"].min(), frame["high"].max()),
                "low": (frame["low"].min(), frame["low"].max()),
                "close": (frame["close"].min(), frame["close"].max()),
            },
            "volume": {
                "min": frame["volume"].min(),
                "max": frame["volume"].max(),
                "mean": frame["volume"].mean(),
            },
        }
