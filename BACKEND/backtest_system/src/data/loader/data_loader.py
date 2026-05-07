"""Data loading utilities.

Responsibilities:
- Read CSV files
- Read parquet files
- Fetch raw market data from APIs
- Perform minimal API-response normalization only
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional

import pandas as pd


class DataLoader:
    """Load raw market data from files or APIs."""

    REQUIRED_COLUMNS = ["timestamp", "open", "high", "low", "close", "volume"]

    def __init__(self, base_dir: str | Path | None = None):
        self.base_dir = Path(base_dir) if base_dir is not None else Path.cwd()

    def load_csv(self, file_path: str | Path) -> pd.DataFrame:
        """Load a CSV file without cleaning or deduplication."""
        path = Path(file_path)
        if not path.is_absolute():
            path = self.base_dir / path
        if not path.exists():
            raise FileNotFoundError(f"CSV file not found: {path}")

        df = pd.read_csv(path)
        return self._standardize_api_frame(df)

    def load_parquet(self, file_path: str | Path) -> pd.DataFrame:
        """Load a parquet file without cleaning or deduplication."""
        path = Path(file_path)
        if not path.is_absolute():
            path = self.base_dir / path
        if not path.exists():
            raise FileNotFoundError(f"Parquet file not found: {path}")

        df = pd.read_parquet(path)
        return self._standardize_api_frame(df)

    def load_from_api(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str = "1d",
        api_source: str = "yfinance",
    ) -> pd.DataFrame:
        """Fetch raw data from a market data API."""
        source = api_source.strip().lower()
        if source == "yfinance":
            return self._load_yfinance(symbol, start_date, end_date, interval)
        if source == "binance":
            return self._load_binance(symbol, start_date, end_date, interval)
        raise ValueError(f"Unsupported API source: {api_source}")

    def load_csv_or_parquet(self, file_path: str | Path) -> pd.DataFrame:
        """Load a file by extension."""
        path = Path(file_path)
        suffix = path.suffix.lower()
        if suffix == ".csv":
            return self.load_csv(path)
        if suffix == ".parquet":
            return self.load_parquet(path)
        raise ValueError(f"Unsupported file format: {path}")

    def _load_yfinance(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str,
    ) -> pd.DataFrame:
        """Fetch raw OHLCV data from yfinance."""
        try:
            import yfinance as yf
        except ImportError as exc:
            raise ImportError("yfinance is not installed. Install with: pip install yfinance") from exc

        df = yf.download(
            symbol,
            start=start_date,
            end=end_date,
            interval=interval,
            progress=False,
            auto_adjust=False,
            group_by="column",
            threads=True,
        )

        if df is None or df.empty:
            return self._empty_frame()

        if isinstance(df.columns, pd.MultiIndex):
            normalized_columns = []
            for column in df.columns:
                parts = [str(part).strip().lower() for part in column if str(part).strip()]
                chosen = next(
                    (part for part in parts if part in {"open", "high", "low", "close", "adj close", "volume", "timestamp", "date", "datetime"}),
                    parts[0] if parts else str(column[-1]).strip().lower(),
                )
                normalized_columns.append(chosen)
            df.columns = normalized_columns
        else:
            df.columns = [str(col).strip().lower() for col in df.columns]

        if "adj close" in df.columns:
            df = df.drop(columns=["adj close"])

        df = df.reset_index()
        if "date" in df.columns and "timestamp" not in df.columns:
            df = df.rename(columns={"date": "timestamp"})
        elif "datetime" in df.columns and "timestamp" not in df.columns:
            df = df.rename(columns={"datetime": "timestamp"})
        elif "index" in df.columns and "timestamp" not in df.columns:
            df = df.rename(columns={"index": "timestamp"})

        return self._standardize_api_frame(df)

    def _load_binance(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str,
    ) -> pd.DataFrame:
        """Fetch raw OHLCV data from Binance."""
        try:
            from binance.client import Client  # type: ignore[reportMissingImports]
        except ImportError as exc:
            raise ImportError("python-binance is not installed. Install with: pip install python-binance") from exc

        interval_map = {
            "1m": Client.KLINE_INTERVAL_1MINUTE,
            "5m": Client.KLINE_INTERVAL_5MINUTE,
            "15m": Client.KLINE_INTERVAL_15MINUTE,
            "30m": Client.KLINE_INTERVAL_30MINUTE,
            "1h": Client.KLINE_INTERVAL_1HOUR,
            "1d": Client.KLINE_INTERVAL_1DAY,
            "1w": Client.KLINE_INTERVAL_1WEEK,
        }
        if interval not in interval_map:
            raise ValueError(f"Unsupported Binance interval: {interval}")

        client = Client()
        klines = client.get_historical_klines(
            symbol,
            interval_map[interval],
            start_str=start_date,
            end_str=end_date,
        )

        if not klines:
            return self._empty_frame()

        df = pd.DataFrame(
            klines,
            columns=[
                "timestamp",
                "open",
                "high",
                "low",
                "close",
                "volume",
                "close_time",
                "quote_asset_volume",
                "number_of_trades",
                "taker_buy_base",
                "taker_buy_quote",
                "ignore",
            ],
        )
        df = df[["timestamp", "open", "high", "low", "close", "volume"]]
        return self._standardize_api_frame(df)

    def _standardize_api_frame(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize API responses to a standard raw OHLCV frame."""
        if df is None or df.empty:
            return self._empty_frame()

        frame = df.copy()
        frame.columns = [str(col).strip().lower() for col in frame.columns]
        
        if "date" in frame.columns and "timestamp" not in frame.columns:
            frame = frame.rename(columns={"date": "timestamp"})
        elif "datetime" in frame.columns and "timestamp" not in frame.columns:
            frame = frame.rename(columns={"datetime": "timestamp"})

        if "timestamp" not in frame.columns:
            frame = frame.reset_index()
            frame.columns = [str(col).strip().lower() for col in frame.columns]
            if "timestamp" not in frame.columns and frame.columns.size > 0:
                frame = frame.rename(columns={frame.columns[0]: "timestamp"})

        frame = frame[[col for col in frame.columns if col in {"timestamp", *self.REQUIRED_COLUMNS, "adj close"}]]
        return frame

    def _empty_frame(self) -> pd.DataFrame:
        """Return an empty raw market data frame."""
        return pd.DataFrame(columns=self.REQUIRED_COLUMNS)
