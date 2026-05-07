"""High-level market data orchestration.

Responsibilities:
- Cache-first data retrieval
- Coverage detection on processed parquet
- Missing-range detection, including internal gaps
- Incremental yfinance fetching only for missing segments
- Merge raw + new data
- Process and persist vectorbt-ready parquet
- Return only the requested slice to the engine

The engine should never fetch or manage cache directly.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd

from ..loader.data_loader import DataLoader
from ..processor.data_processor import DataProcessor
from ..storage.data_storage import DataStorage


@dataclass(frozen=True)
class MarketDataResult:
    """Metadata returned by cache-aware retrieval."""

    data: pd.DataFrame
    source: str
    updated: bool
    symbol: str
    interval: str
    requested_start: pd.Timestamp
    requested_end: pd.Timestamp
    coverage_start: Optional[pd.Timestamp]
    coverage_end: Optional[pd.Timestamp]
    missing_ranges: List[Tuple[pd.Timestamp, pd.Timestamp]]
    raw_path: Optional[str]
    processed_path: Optional[str]


class MarketDataManager:
    """Public interface for the data layer."""

    def __init__(
        self,
        base_path: str | Path | None = None,
        handle_missing: str = "forward_fill",
        api_source: str = "yfinance",
    ):
        self.base_path = self._default_base_path() if base_path is None else Path(base_path)
        self.storage = DataStorage(self.base_path)
        self.loader = DataLoader(base_dir=self.base_path)
        self.processor = DataProcessor(handle_missing=handle_missing)
        self.api_source = api_source

    def get_data(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str = "1min",
        api_source: Optional[str] = None,
        save: bool = True,
        force_refresh: bool = False,
    ) -> pd.DataFrame:
        """Return only the requested dataframe slice."""
        data, _ = self.get_data_with_metadata(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            interval=interval,
            api_source=api_source,
            save=save,
            force_refresh=force_refresh,
        )
        return data

    def get_data_with_metadata(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str = "1min",
        api_source: Optional[str] = None,
        save: bool = True,
        force_refresh: bool = False,
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Return the requested slice plus cache/fetch metadata."""
        normalized_symbol = symbol.strip().upper()
        normalized_interval = self._normalize_interval(interval)
        requested_start = pd.to_datetime(start_date)
        requested_end = pd.to_datetime(end_date)
        source = (api_source or self.api_source).strip().lower()

        if requested_end < requested_start:
            raise ValueError("end_date must be greater than or equal to start_date")

        processed_path = self.storage.processed_file_path(normalized_symbol, normalized_interval)
        raw_path = self.storage.raw_file_path(normalized_symbol, normalized_interval)

        existing_processed = self._load_existing_processed(normalized_symbol, normalized_interval)

        if existing_processed.empty or force_refresh:
            fetched_full = self._fetch_api_range(
                symbol=normalized_symbol,
                start=requested_start,
                end=requested_end,
                interval=normalized_interval,
                api_source=source,
            )
            merged_raw = self._merge_frames(
                self._load_existing_raw_or_fallback(normalized_symbol, normalized_interval, existing_processed),
                fetched_full,
            )
            processed = self.processor.process(merged_raw.copy())
            if save:
                self._persist(normalized_symbol, normalized_interval, merged_raw, processed)
            sliced = self._slice_requested_range(processed, requested_start, requested_end)
            return sliced, self._build_metadata(
                data=sliced,
                source=source,
                updated=not fetched_full.empty,
                symbol=normalized_symbol,
                interval=normalized_interval,
                requested_start=requested_start,
                requested_end=requested_end,
                coverage_start=self._coverage_start(processed),
                coverage_end=self._coverage_end(processed),
                missing_ranges=[(requested_start, requested_end)] if not fetched_full.empty else [],
                raw_path=str(raw_path) if raw_path.exists() else None,
                processed_path=str(processed_path) if processed_path.exists() else None,
            )

        missing_ranges = self._detect_missing_ranges(existing_processed, requested_start, requested_end, normalized_interval)
        if not missing_ranges:
            sliced = self._slice_requested_range(existing_processed, requested_start, requested_end)
            return sliced, self._build_metadata(
                data=sliced,
                source="parquet",
                updated=False,
                symbol=normalized_symbol,
                interval=normalized_interval,
                requested_start=requested_start,
                requested_end=requested_end,
                coverage_start=self._coverage_start(existing_processed),
                coverage_end=self._coverage_end(existing_processed),
                missing_ranges=[],
                raw_path=str(raw_path) if raw_path.exists() else None,
                processed_path=str(processed_path),
            )

        fetched_parts: List[pd.DataFrame] = []
        fetched_ranges: List[Tuple[pd.Timestamp, pd.Timestamp]] = []
        for missing_start, missing_end in missing_ranges:
            fetch_start, fetch_end = self._expand_fetch_window(missing_start, missing_end, normalized_interval)
            fetched = self._fetch_api_range(
                symbol=normalized_symbol,
                start=fetch_start,
                end=fetch_end,
                interval=normalized_interval,
                api_source=source,
            )
            if not fetched.empty:
                fetched_parts.append(fetched)
                fetched_ranges.append((missing_start, missing_end))

        if not fetched_parts:
            sliced = self._slice_requested_range(existing_processed, requested_start, requested_end)
            return sliced, self._build_metadata(
                data=sliced,
                source="parquet",
                updated=False,
                symbol=normalized_symbol,
                interval=normalized_interval,
                requested_start=requested_start,
                requested_end=requested_end,
                coverage_start=self._coverage_start(existing_processed),
                coverage_end=self._coverage_end(existing_processed),
                missing_ranges=missing_ranges,
                raw_path=str(raw_path) if raw_path.exists() else None,
                processed_path=str(processed_path),
            )

        merged_raw = self._merge_frames(
            self._load_existing_raw_or_fallback(normalized_symbol, normalized_interval, existing_processed),
            *fetched_parts,
        )
        processed = self.processor.process(merged_raw.copy())
        if save:
            self._persist(normalized_symbol, normalized_interval, merged_raw, processed)

        sliced = self._slice_requested_range(processed, requested_start, requested_end)
        return sliced, self._build_metadata(
            data=sliced,
            source="parquet+incremental",
            updated=True,
            symbol=normalized_symbol,
            interval=normalized_interval,
            requested_start=requested_start,
            requested_end=requested_end,
            coverage_start=self._coverage_start(processed),
            coverage_end=self._coverage_end(processed),
            missing_ranges=fetched_ranges,
            raw_path=str(raw_path) if raw_path.exists() else None,
            processed_path=str(processed_path) if processed_path.exists() else None,
        )

    def _fetch_api_range(
        self,
        symbol: str,
        start: pd.Timestamp,
        end: pd.Timestamp,
        interval: str,
        api_source: str,
    ) -> pd.DataFrame:
        api_interval = self._to_api_interval(interval)
        api_end = end + self._interval_step(interval)
        return self.loader.load_from_api(
            symbol=symbol,
            start_date=start.strftime("%Y-%m-%d"),
            end_date=api_end.strftime("%Y-%m-%d"),
            interval=api_interval,
            api_source=api_source,
        )

    def _persist(self, symbol: str, interval: str, raw_df: pd.DataFrame, processed_df: pd.DataFrame) -> None:
        self.storage.save_raw(raw_df, symbol, interval, index=False)
        self.storage.save_processed(processed_df, symbol, interval, index=True)

    def _load_existing_processed(self, symbol: str, interval: str) -> pd.DataFrame:
        cached = self.storage.load_processed(symbol, interval)
        if cached.empty:
            return cached
        if not isinstance(cached.index, pd.DatetimeIndex):
            cached.index = pd.DatetimeIndex(pd.to_datetime(cached.index, errors="coerce"), name="timestamp")
            cached = cached[~cached.index.isna()]
        cached = cached.sort_index()
        cached = cached[~cached.index.duplicated(keep="last")]
        return cached

    def _load_existing_raw_or_fallback(
        self,
        symbol: str,
        interval: str,
        fallback_processed: pd.DataFrame,
    ) -> pd.DataFrame:
        raw = self.storage.load_raw(symbol, interval)
        if raw.empty and not fallback_processed.empty:
            raw = fallback_processed.reset_index()
        return self._normalize_raw_frame(raw)

    def _normalize_raw_frame(self, df: pd.DataFrame) -> pd.DataFrame:
        if df is None or df.empty:
            return pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])

        frame = df.copy()
        frame.columns = [str(column).strip().lower() for column in frame.columns]
        if "timestamp" not in frame.columns:
            frame = frame.reset_index()
            frame.columns = [str(column).strip().lower() for column in frame.columns]
            if "timestamp" not in frame.columns and len(frame.columns) > 0:
                frame = frame.rename(columns={frame.columns[0]: "timestamp"})

        if "timestamp" in frame.columns:
            frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="coerce")
            frame = frame[frame["timestamp"].notna()]

        frame = frame.sort_values("timestamp") if "timestamp" in frame.columns else frame
        frame = frame.drop_duplicates(subset=["timestamp"], keep="last") if "timestamp" in frame.columns else frame
        return frame.reset_index(drop=True)

    def _merge_frames(self, *frames: pd.DataFrame) -> pd.DataFrame:
        valid_frames = [self._normalize_raw_frame(frame) for frame in frames if frame is not None and not frame.empty]
        if not valid_frames:
            return pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])

        combined = pd.concat(valid_frames, ignore_index=True)
        combined = self._normalize_raw_frame(combined)
        return combined

    def _slice_requested_range(self, frame: pd.DataFrame, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
        if frame is None or frame.empty:
            return frame.copy() if frame is not None else pd.DataFrame()

        data = frame.copy()
        if not isinstance(data.index, pd.DatetimeIndex):
            if "timestamp" not in data.columns:
                return pd.DataFrame()
            data["timestamp"] = pd.to_datetime(data["timestamp"], errors="coerce")
            data = data[data["timestamp"].notna()].set_index("timestamp")

        data = data.sort_index()
        # Align timezone-awareness between requested start/end and the DataFrame index
        start_ts = pd.to_datetime(start)
        end_ts = pd.to_datetime(end)
        idx_tz = getattr(data.index, "tz", None)

        if idx_tz is not None:
            # index is tz-aware -> localize/convert requested timestamps to index tz
            if start_ts.tzinfo is None:
                start_ts = start_ts.tz_localize(idx_tz)
            else:
                start_ts = start_ts.tz_convert(idx_tz)
            if end_ts.tzinfo is None:
                end_ts = end_ts.tz_localize(idx_tz)
            else:
                end_ts = end_ts.tz_convert(idx_tz)
        else:
            # index is tz-naive -> drop tz from requested timestamps if present
            if start_ts.tzinfo is not None:
                start_ts = pd.Timestamp(start_ts.value)
            if end_ts.tzinfo is not None:
                end_ts = pd.Timestamp(end_ts.value)

        return data.loc[(data.index >= start_ts) & (data.index <= end_ts)].copy()

    def _detect_missing_ranges(
        self,
        existing_processed: pd.DataFrame,
        requested_start: pd.Timestamp,
        requested_end: pd.Timestamp,
        interval: str,
    ) -> List[Tuple[pd.Timestamp, pd.Timestamp]]:
        step = self._interval_step(interval)

        # Normalize requested timestamps
        req_start = pd.to_datetime(requested_start)
        req_end = pd.to_datetime(requested_end)

        # If no existing processed data, entire range is missing
        if existing_processed is None or existing_processed.empty:
            return [(req_start, req_end)]

        # Align timezone of requested timestamps with existing data index
        idx_tz = getattr(existing_processed.index, "tz", None)
        if idx_tz is not None:
            if req_start.tzinfo is None:
                req_start = req_start.tz_localize(idx_tz)
            else:
                req_start = req_start.tz_convert(idx_tz)
            if req_end.tzinfo is None:
                req_end = req_end.tz_localize(idx_tz)
            else:
                req_end = req_end.tz_convert(idx_tz)
        else:
            if req_start.tzinfo is not None:
                req_start = pd.Timestamp(req_start.value)
            if req_end.tzinfo is not None:
                req_end = pd.Timestamp(req_end.value)

        # Slice existing processed to the requested window
        requested_slice = self._slice_requested_range(existing_processed, req_start, req_end)
        if requested_slice.empty:
            return [(req_start, req_end)]

        existing_index = pd.DatetimeIndex(requested_slice.index.unique()).sort_values()
        missing_ranges: List[Tuple[pd.Timestamp, pd.Timestamp]] = []

        first_timestamp = existing_index.min()
        last_timestamp = existing_index.max()
        if req_start < first_timestamp:
            missing_ranges.append((req_start, first_timestamp - step))
        if req_end > last_timestamp:
            missing_ranges.append((last_timestamp + step, req_end))

        previous = existing_index[0]
        for current in existing_index[1:]:
            if current - previous > step:
                missing_start = previous + step
                missing_end = current - step
                if missing_start <= missing_end:
                    missing_ranges.append((missing_start, missing_end))
            previous = current

        return self._merge_ranges(missing_ranges)

    def _merge_ranges(self, ranges: Iterable[Tuple[pd.Timestamp, pd.Timestamp]]) -> List[Tuple[pd.Timestamp, pd.Timestamp]]:
        normalized = sorted((start, end) for start, end in ranges if start <= end)
        if not normalized:
            return []

        merged: List[Tuple[pd.Timestamp, pd.Timestamp]] = [normalized[0]]
        for start, end in normalized[1:]:
            last_start, last_end = merged[-1]
            if start <= last_end + pd.Timedelta(seconds=1):
                merged[-1] = (last_start, max(last_end, end))
            else:
                merged.append((start, end))
        return merged

    def _expand_fetch_window(self, start: pd.Timestamp, end: pd.Timestamp, interval: str) -> Tuple[pd.Timestamp, pd.Timestamp]:
        step = self._interval_step(interval)
        return start, end + step

    def _interval_step(self, interval: str) -> pd.Timedelta:
        mapping = {
            "1min": pd.Timedelta(minutes=1),
            "2min": pd.Timedelta(minutes=2),
            "5min": pd.Timedelta(minutes=5),
            "15min": pd.Timedelta(minutes=15),
            "30min": pd.Timedelta(minutes=30),
            "1h": pd.Timedelta(hours=1),
            "1d": pd.Timedelta(days=1),
            "1wk": pd.Timedelta(weeks=1),
            "1mo": pd.Timedelta(days=30),
        }
        return mapping.get(interval, pd.Timedelta(days=1))

    def _to_api_interval(self, interval: str) -> str:
        mapping = {
            "1min": "1m",
            "2min": "2m",
            "5min": "5m",
            "15min": "15m",
            "30min": "30m",
            "1h": "1h",
            "1d": "1d",
            "1wk": "1wk",
            "1mo": "1mo",
        }
        return mapping.get(interval, interval)

    def _normalize_interval(self, interval: str) -> str:
        normalized = interval.strip().lower()
        mapping = {
            "1m": "1min",
            "1min": "1min",
            "2m": "2min",
            "2min": "2min",
            "5m": "5min",
            "5min": "5min",
            "15m": "15min",
            "15min": "15min",
            "30m": "30min",
            "30min": "30min",
            "60m": "1h",
            "1h": "1h",
            "1d": "1d",
            "1day": "1d",
            "1w": "1wk",
            "1wk": "1wk",
            "1mo": "1mo",
        }
        return mapping.get(normalized, normalized)

    def _coverage_start(self, frame: pd.DataFrame) -> Optional[pd.Timestamp]:
        if frame is None or frame.empty:
            return None
        if isinstance(frame.index, pd.DatetimeIndex):
            return frame.index.min()
        if "timestamp" in frame.columns:
            return pd.to_datetime(frame["timestamp"], errors="coerce").min()
        return None

    def _coverage_end(self, frame: pd.DataFrame) -> Optional[pd.Timestamp]:
        if frame is None or frame.empty:
            return None
        if isinstance(frame.index, pd.DatetimeIndex):
            return frame.index.max()
        if "timestamp" in frame.columns:
            return pd.to_datetime(frame["timestamp"], errors="coerce").max()
        return None

    def _build_metadata(
        self,
        data: pd.DataFrame,
        source: str,
        updated: bool,
        symbol: str,
        interval: str,
        requested_start: pd.Timestamp,
        requested_end: pd.Timestamp,
        coverage_start: Optional[pd.Timestamp],
        coverage_end: Optional[pd.Timestamp],
        missing_ranges: List[Tuple[pd.Timestamp, pd.Timestamp]],
        raw_path: Optional[str],
        processed_path: Optional[str],
    ) -> Dict[str, Any]:
        return {
            "source": source,
            "updated": updated,
            "symbol": symbol,
            "interval": interval,
            "requested_start": requested_start,
            "requested_end": requested_end,
            "coverage_start": coverage_start,
            "coverage_end": coverage_end,
            "missing_ranges": missing_ranges,
            "rows": len(data),
            "raw_path": raw_path,
            "processed_path": processed_path,
        }

    def _default_base_path(self) -> Path:
        return Path(__file__).resolve().parents[3] / "data"
