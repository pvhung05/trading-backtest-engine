"""Data persistence utilities.

Responsibilities:
- Manage raw CSV paths
- Manage processed parquet paths
- Save raw data
- Save/load processed parquet data
- Never merge or fetch data
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd


class DataStorage:
    """File-system access for raw and processed market data."""

    def __init__(self, base_path: str | Path = "data"):
        self.base_path = Path(base_path)
        self.raw_dir = self.base_path / "raw"
        self.processed_dir = self.base_path / "processed"
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def raw_file_path(self, symbol: str, interval: str) -> Path:
        return self.raw_dir / f"{symbol}_{interval}.csv"

    def processed_file_path(self, symbol: str, interval: str) -> Path:
        return self.processed_dir / f"{symbol}_{interval}.parquet"

    def raw_exists(self, symbol: str, interval: str) -> bool:
        return self.raw_file_path(symbol, interval).exists()

    def processed_exists(self, symbol: str, interval: str) -> bool:
        return self.processed_file_path(symbol, interval).exists()

    def load_raw(self, symbol: str, interval: str) -> pd.DataFrame:
        path = self.raw_file_path(symbol, interval)
        if not path.exists():
            return pd.DataFrame()
        return pd.read_csv(path)

    def load_processed(self, symbol: str, interval: str) -> pd.DataFrame:
        path = self.processed_file_path(symbol, interval)
        if not path.exists():
            return pd.DataFrame()
        return pd.read_parquet(path)

    def save_raw(self, df: pd.DataFrame, symbol: str, interval: str, index: bool = False) -> Path:
        path = self.raw_file_path(symbol, interval)
        df.to_csv(path, index=index)
        return path

    def save_processed(
        self,
        df: pd.DataFrame,
        symbol: str,
        interval: str,
        index: bool = True,
        compression: str = "snappy",
    ) -> Path:
        path = self.processed_file_path(symbol, interval)
        df.to_parquet(path, index=index, compression=compression)
        return path

    def delete_raw(self, symbol: str, interval: str) -> None:
        path = self.raw_file_path(symbol, interval)
        if path.exists():
            path.unlink()

    def delete_processed(self, symbol: str, interval: str) -> None:
        path = self.processed_file_path(symbol, interval)
        if path.exists():
            path.unlink()
