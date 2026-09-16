"""Walk-forward backtest for the confluence strategy in src/strategy.py.

Re-uses the exact same scoring functions as live trading (imported from
`strategy.py`, not reimplemented) so backtest results reflect what the bot
would actually have signaled. For each historical bar, only data up to and
including that bar is used to compute indicators/scores — no lookahead.

When a signal fires (and the symbol has no open trade), a trade is "opened"
at the *next* bar's open price, then walked forward bar-by-bar until its
stop-loss or take-profit is hit (checked against that bar's high/low), a
max holding period elapses, or the data runs out.

Usage (requires a real TWELVE_DATA_API_KEY - see README):
    python -m src.backtest --start 2024-01-01 --end 2024-12-31
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from typing import Optional

import pandas as pd

from . import data_provider, indicators
from .main import load_watchlist
from .strategy import (
    ATR_STOP_MULTIPLIER,
    BREAKOUT_LOOKBACK,
    RISK_REWARD,
    SCORE_THRESHOLD,
    _breakout_score,
    _macd_score,
    _momentum_score,
    _trend_score,
)

MAX_HOLD_BARS = 60  # force-close a trade after this many bars if neither level is hit


@dataclass
class Trade:
    symbol: str
    direction: str
    entry_time: object
    entry_price: float
    stop_loss: float
    take_profit: float
    exit_time: object
    exit_price: float
    exit_reason: str  # "TARGET", "STOP", or "TIME"
    r_multiple: float


def _score_at(df: pd.DataFrame, i: int) -> int:
    """Score at row i using only rows [0, i] - identical logic to strategy.evaluate()."""
    window = df.iloc[: i + 1]
    latest = window.iloc[-1]
    score = 0
    score += _trend_score(latest)
    score += _momentum_score(latest)
    score += _macd_score(latest)
    score += _breakout_score(window)
    return score


def simulate_symbol(symbol: str, raw_df: pd.DataFrame) -> list[Trade]:
    """Run the walk-forward simulation for one symbol's candle history."""
    warmup = BREAKOUT_LOOKBACK + 50
    if len(raw_df) < warmup + MAX_HOLD_BARS:
        return []

    df = indicators.add_all_indicators(raw_df)
    trades: list[Trade] = []
    open_trade: Optional[dict] = None

    for i in range(warmup, len(df) - 1):
        row = df.iloc[i]

        if open_trade is not None:
            bar = df.iloc[i]
            hit_stop = bar.low <= open_trade["stop_loss"] if open_trade["direction"] == "BUY" else bar.high >= open_trade["stop_loss"]
            hit_target = bar.high >= open_trade["take_profit"] if open_trade["direction"] == "BUY" else bar.low <= open_trade["take_profit"]

            exit_price = None
            exit_reason = None
            if hit_stop and hit_target:
                # Both levels fall inside this bar's range - assume the worse (conservative) fill.
                exit_price, exit_reason = open_trade["stop_loss"], "STOP"
            elif hit_stop:
                exit_price, exit_reason = open_trade["stop_loss"], "STOP"
            elif hit_target:
                exit_price, exit_reason = open_trade["take_profit"], "TARGET"
            elif i - open_trade["entry_index"] >= MAX_HOLD_BARS:
                exit_price, exit_reason = float(bar.close), "TIME"

            if exit_price is not None:
                stop_distance = abs(open_trade["entry_price"] - open_trade["stop_loss"])
                raw_pnl = (
                    exit_price - open_trade["entry_price"]
                    if open_trade["direction"] == "BUY"
                    else open_trade["entry_price"] - exit_price
                )
                trades.append(
                    Trade(
                        symbol=symbol,
                        direction=open_trade["direction"],
                        entry_time=open_trade["entry_time"],
                        entry_price=round(open_trade["entry_price"], 5),
                        stop_loss=round(open_trade["stop_loss"], 5),
                        take_profit=round(open_trade["take_profit"], 5),
                        exit_time=bar.datetime,
                        exit_price=round(float(exit_price), 5),
                        exit_reason=exit_reason,
                        r_multiple=round(raw_pnl / stop_distance, 3) if stop_distance else 0.0,
                    )
                )
                open_trade = None
            continue  # one trade at a time per symbol

        score = _score_at(df, i)
        if abs(score) < SCORE_THRESHOLD:
            continue

        direction = "BUY" if score > 0 else "SELL"
        entry_bar = df.iloc[i + 1]  # execute at next bar's open, not the signal bar's close
        entry_price = float(entry_bar.open)
        stop_distance = float(row.atr14) * ATR_STOP_MULTIPLIER
        if direction == "BUY":
            stop_loss = entry_price - stop_distance
            take_profit = entry_price + stop_distance * RISK_REWARD
        else:
            stop_loss = entry_price + stop_distance
            take_profit = entry_price - stop_distance * RISK_REWARD

        open_trade = {
            "direction": direction,
            "entry_index": i + 1,
            "entry_time": entry_bar.datetime,
            "entry_price": entry_price,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
        }

    return trades


def summarize(trades: list[Trade]) -> dict:
    if not trades:
        return {"total_trades": 0}

    r_values = [t.r_multiple for t in trades]
    wins = [r for r in r_values if r > 0]
    losses = [r for r in r_values if r <= 0]

    equity = []
    running = 0.0
    peak = 0.0
    max_dd = 0.0
    for r in r_values:
        running += r
        peak = max(peak, running)
        max_dd = max(max_dd, peak - running)
        equity.append(running)

    gross_win = sum(wins)
    gross_loss = abs(sum(losses))

    return {
        "total_trades": len(trades),
        "wins": len(wins),
        "losses": len(losses),
        "win_rate_pct": round(len(wins) / len(trades) * 100, 1),
        "avg_r": round(sum(r_values) / len(r_values), 3),
        "total_r": round(sum(r_values), 2),
        "profit_factor": round(gross_win / gross_loss, 2) if gross_loss else float("inf"),
        "max_drawdown_r": round(max_dd, 2),
        "best_trade_r": round(max(r_values), 2),
        "worst_trade_r": round(min(r_values), 2),
        "equity_curve_r": equity,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Backtest the confluence strategy against historical data.")
    parser.add_argument("--start", help="start date YYYY-MM-DD (optional, Twelve Data start_date)")
    parser.add_argument("--end", help="end date YYYY-MM-DD (optional, Twelve Data end_date)")
    parser.add_argument("--outputsize", type=int, default=5000, help="max candles to fetch per symbol")
    args = parser.parse_args()

    api_key = os.environ.get("TWELVE_DATA_API_KEY")
    if not api_key:
        print("ERROR: TWELVE_DATA_API_KEY is not set.")
        return 1

    symbols, interval, _ = load_watchlist()
    all_trades: list[Trade] = []

    for symbol in symbols:
        try:
            df = data_provider.fetch_candles(
                symbol, interval, args.outputsize, api_key, start_date=args.start, end_date=args.end
            )
            trades = simulate_symbol(symbol, df)
            all_trades.extend(trades)
            stats = summarize(trades)
            print(f"{symbol}: {stats.get('total_trades', 0)} trades, "
                  f"win rate {stats.get('win_rate_pct', 0)}%, avg R {stats.get('avg_r', 0)}")
        except data_provider.DataProviderError as e:
            print(f"WARN: skipping {symbol} - {e}")

    print("\n=== Combined results ===")
    overall = summarize(all_trades)
    for k, v in overall.items():
        if k != "equity_curve_r":
            print(f"{k}: {v}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
