"""Multi-indicator confluence strategy.

Combines trend (EMA stack), momentum (RSI), momentum confirmation (MACD),
and a breakout/breakdown check against recent price structure. Each
condition contributes to a score in the range [-5, +5] (trend counts double,
via EMA9/EMA21 crossover and price vs EMA50). A signal only fires when
enough conditions agree.

This is intentionally simple and transparent so you can see exactly why a
signal fired and tune the thresholds in `evaluate()` below.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import pandas as pd

from . import indicators

MAX_SCORE = 5              # trend(+-2) + momentum(+-1) + macd(+-1) + breakout(+-1)
SCORE_THRESHOLD = 3        # |score| >= this fires a signal (out of MAX_SCORE)
BREAKOUT_LOOKBACK = 20     # bars used to define recent range high/low
RISK_REWARD = 2.0          # take-profit distance = RISK_REWARD * stop distance
ATR_STOP_MULTIPLIER = 1.5


@dataclass
class Signal:
    symbol: str
    direction: str          # "BUY" or "SELL"
    score: int
    confidence: float       # 0-100
    entry: float
    stop_loss: float
    take_profit: float
    rsi: float
    macd_hist: float
    ema9: float
    ema21: float
    ema50: float
    atr: float
    timeframe: str
    generated_at: str


def _trend_score(latest) -> int:
    score = 0
    score += 1 if latest.ema9 > latest.ema21 else -1
    score += 1 if latest.close > latest.ema50 else -1
    return score


def _momentum_score(latest) -> int:
    if latest.rsi14 > 55:
        return 1
    if latest.rsi14 < 45:
        return -1
    return 0


def _macd_score(latest) -> int:
    if latest.macd > latest.macd_signal and latest.macd_hist > 0:
        return 1
    if latest.macd < latest.macd_signal and latest.macd_hist < 0:
        return -1
    return 0


def _breakout_score(df: pd.DataFrame) -> int:
    window = df.iloc[-(BREAKOUT_LOOKBACK + 1):-1]
    latest_close = df.iloc[-1].close
    if latest_close > window["high"].max():
        return 1
    if latest_close < window["low"].min():
        return -1
    return 0


def evaluate(symbol: str, df: pd.DataFrame, timeframe: str) -> Signal | None:
    """Run the confluence strategy on a candle DataFrame and return a Signal, or None."""
    if len(df) < BREAKOUT_LOOKBACK + 50:
        return None  # not enough history for reliable indicators

    df = indicators.add_all_indicators(df)
    latest = df.iloc[-1]

    score = 0
    score += _trend_score(latest)
    score += _momentum_score(latest)
    score += _macd_score(latest)
    score += _breakout_score(df)

    if abs(score) < SCORE_THRESHOLD:
        return None

    direction = "BUY" if score > 0 else "SELL"
    entry = float(latest.close)
    stop_distance = float(latest.atr14) * ATR_STOP_MULTIPLIER
    if direction == "BUY":
        stop_loss = entry - stop_distance
        take_profit = entry + stop_distance * RISK_REWARD
    else:
        stop_loss = entry + stop_distance
        take_profit = entry - stop_distance * RISK_REWARD

    return Signal(
        symbol=symbol,
        direction=direction,
        score=score,
        confidence=round(abs(score) / MAX_SCORE * 100, 1),
        entry=round(entry, 5),
        stop_loss=round(stop_loss, 5),
        take_profit=round(take_profit, 5),
        rsi=round(float(latest.rsi14), 1),
        macd_hist=round(float(latest.macd_hist), 5),
        ema9=round(float(latest.ema9), 5),
        ema21=round(float(latest.ema21), 5),
        ema50=round(float(latest.ema50), 5),
        atr=round(float(latest.atr14), 5),
        timeframe=timeframe,
        generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
