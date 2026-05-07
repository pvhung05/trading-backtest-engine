"""Public data layer API."""

from .manager.data_manager import MarketDataManager, MarketDataResult
from .loader.data_loader import DataLoader
from .processor.data_processor import DataProcessor, ProcessingResult
from .storage.data_storage import DataStorage
from .converter.data_converter import DataConverter
from .processor.data_resampler import DataResampler

MarketDataService = MarketDataManager

__all__ = [
    "MarketDataManager",
    "MarketDataService",
    "MarketDataResult",
    "DataLoader",
    "DataProcessor",
    "ProcessingResult",
    "DataStorage",
    "DataConverter",
    "DataResampler",
]
