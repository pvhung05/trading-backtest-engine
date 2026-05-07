"""CSV to parquet conversion utilities.

Responsibilities:
- Convert raw CSV files to parquet
- Validate round-trip conversion basics
- Never clean or enrich market data
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional, Tuple

import pandas as pd


class DataConverter:
    """Convert raw CSV files into parquet files."""

    def __init__(self, raw_dir: str | Path = "data/raw", processed_dir: str | Path = "data/processed"):
        self.raw_dir = Path(raw_dir)
        self.processed_dir = Path(processed_dir)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def convert_csv_to_parquet(
        self,
        csv_filename: str,
        parquet_filename: Optional[str] = None,
        compression: str = "snappy",
        index: bool = False,
    ) -> Tuple[bool, str, Dict[str, object]]:
        """Convert one CSV file to parquet without altering the payload."""
        csv_path = self.raw_dir / csv_filename
        if not csv_path.exists():
            return False, f"CSV file not found: {csv_path}", {}

        df = pd.read_csv(csv_path)
        output_filename = parquet_filename or csv_filename.replace(".csv", ".parquet")
        if not output_filename.endswith(".parquet"):
            output_filename = f"{output_filename}.parquet"

        parquet_path = self.processed_dir / output_filename
        df.to_parquet(parquet_path, compression=compression, index=index)

        stats = {
            "rows": len(df),
            "columns": len(df.columns),
            "csv_path": str(csv_path),
            "parquet_path": str(parquet_path),
        }
        return True, f"Converted {csv_filename} -> {parquet_path.name}", stats
