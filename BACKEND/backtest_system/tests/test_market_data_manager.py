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
    df, aapl_meta = get_data("AAPL", "2025-05-31", "2025-06-11", "1d", return_meta=True)
    print(aapl_meta)
    print("\nAAPL sample head:\n", df.head())
    print("\nAAPL sample tail:\n", df.tail())
    print("\nAAPL rows:", len(df))


if __name__ == "__main__":
    run_tests()
