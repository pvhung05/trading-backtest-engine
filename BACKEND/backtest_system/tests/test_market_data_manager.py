import sys
import os
from pathlib import Path
import shutil
import time
import traceback

import pandas as pd


# Ensure project `src` is importable
HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "src"
sys.path.insert(0, str(SRC))

from data.api import get_data


def rm_tree(p: Path):
    if p.exists():
        if p.is_dir():
            shutil.rmtree(p)
        else:
            p.unlink()


def run_tests():
    df, btc_meta = get_data("BTC-USD", "2025-01-01", "2026-05-07", "1h", return_meta=True)
    print(btc_meta)
    print("\nBTC sample head:\n", df.head())
    print("\nBTC sample tail:\n", df.tail())
    print("\nBTC rows:", len(df))


if __name__ == "__main__":
    run_tests()
