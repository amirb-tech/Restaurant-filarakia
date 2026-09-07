"""Market data fetching via the Twelve Data API (free tier covers stocks + forex)."""

import pandas as pd
import requests

BASE_URL = "https://api.twelvedata.com/time_series"


class DataProviderError(Exception):
    pass


def fetch_candles(symbol: str, interval: str, outputsize: int, api_key: str) -> pd.DataFrame:
    """Fetch OHLCV candles for a symbol, oldest-first, as a DataFrame."""
    params = {
        "symbol": symbol,
        "interval": interval,
        "outputsize": outputsize,
        "apikey": api_key,
        "format": "JSON",
    }
    response = requests.get(BASE_URL, params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()

    if payload.get("status") == "error":
        raise DataProviderError(f"{symbol}: {payload.get('message', 'unknown API error')}")

    values = payload.get("values")
    if not values:
        raise DataProviderError(f"{symbol}: no candle data returned")

    df = pd.DataFrame(values)
    df = df.rename(columns={"datetime": "datetime"})
    numeric_cols = ["open", "high", "low", "close", "volume"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    df["datetime"] = pd.to_datetime(df["datetime"])

    # Twelve Data returns newest-first; strategy code expects oldest-first.
    df = df.sort_values("datetime").reset_index(drop=True)
    return df
