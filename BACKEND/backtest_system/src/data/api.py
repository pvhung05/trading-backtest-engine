"""Convenience API for retrieving market data.

Expose a simple `get_data(...)` that delegates to the MarketDataManager
and preserves cache-first, incremental, and storage behaviors.
"""
from typing import Optional, Tuple
from pathlib import Path

from .manager.data_manager import MarketDataManager
import pandas as pd


def get_data(symbol: str,
             start_date: str,
             end_date: str,
             interval: str = "1d",
             base_path: Optional[str] = None,
             return_meta: bool = False) -> "pd.DataFrame | Tuple[pd.DataFrame, dict]":
    """Fetch data for `symbol` between `start_date` and `end_date` at `interval`.

    This is a thin wrapper around `MarketDataManager` and follows the project's
    data rules: cache-first, incremental fetches, raw+processed persistence,
    deduplication, and vectorbt-ready output (DatetimeIndex, sorted, unique).

    Args:
      symbol: ticker symbol (e.g. "AAPL" or "BTC-USD").
      start_date: inclusive start date string (YYYY-MM-DD).
      end_date: exclusive end date string (YYYY-MM-DD) or inclusive depending on manager.
      interval: data interval (e.g. "1d", "1m").
      base_path: optional base storage path (overrides manager default).
      return_meta: if True, return `(df, metadata)` else return `df`.

    Returns:
      `pd.DataFrame` or `(pd.DataFrame, dict)` when `return_meta` is True.
    """
    manager_kwargs = {}
    if base_path:
        manager_kwargs["base_path"] = str(base_path)

    mgr = MarketDataManager(**manager_kwargs) if manager_kwargs else MarketDataManager()
    df, meta = mgr.get_data_with_metadata(symbol, start_date, end_date, interval=interval)
    if return_meta:
        return df, meta
    return df
