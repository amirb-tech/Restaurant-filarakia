# AI Trading Copilot

Scans a watchlist of US stocks and forex pairs on an intraday timeframe,
looks for confluence between trend/momentum/breakout indicators, and sends
BUY/SELL alerts to a Telegram chat. It generates **signals only** — it never
places trades.

Runs on a GitHub Actions schedule (every 30 minutes on weekdays), so there's
no server to maintain.

## How the strategy works

For each symbol, on every scan, four independent checks are scored
(`src/strategy.py`):

| Check | Bullish (+) | Bearish (-) |
|---|---|---|
| Trend (EMA9 vs EMA21, price vs EMA50) | +2 max | -2 max |
| Momentum (RSI14) | RSI > 55 | RSI < 45 |
| MACD confirmation | MACD > signal & rising histogram | MACD < signal & falling histogram |
| Breakout | close breaks 20-bar high | close breaks 20-bar low |

Scores range from -5 to +5. A signal only fires when `|score| >= 3`
(configurable via `SCORE_THRESHOLD` in `src/strategy.py`). Stop-loss and
take-profit are derived from ATR(14): stop = 1.5x ATR, target = 2x the stop
distance (1:2 risk/reward).

This is a transparent, rules-based starting point — tune the thresholds,
indicators, or scoring weights in `src/strategy.py` as you learn what works
for your markets.

## Setup

### 1. Get a free market data API key

We use [Twelve Data](https://twelvedata.com/pricing) (free tier: 800
requests/day, 8/minute — covers stocks, forex, and crypto with one API).

1. Sign up at https://twelvedata.com
2. Copy your API key from the dashboard.

### 2. Create a Telegram bot

1. Open Telegram, message **@BotFather**, send `/newbot`, and follow the
   prompts. You'll get a **bot token** like `123456:ABC-DEF...`.
2. Message your new bot anything (e.g. "hi") so it can see your chat.
3. Get your **chat ID**: visit
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser after
   step 2, and look for `"chat":{"id": ...}` in the response.
   - For a group/channel, add the bot to it first, then use the group's
     (negative) chat ID from the same endpoint.

### 3. Add repository secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New
repository secret**, add:

- `TWELVE_DATA_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

### 4. Enable the workflow

The workflow at `.github/workflows/trading-copilot.yml` runs automatically
every 30 minutes on weekdays once the secrets above are set. You can also
trigger it manually from the **Actions** tab (`Run workflow`), optionally
with **dry_run** checked to print signals to the log instead of sending
Telegram messages.

## Customizing the watchlist

Edit `config/watchlist.yaml`:

```yaml
interval: "1h"     # "15min" or "1h" recommended for the free API tier
lookback: 150

stocks:
  - AAPL
  - MSFT

forex:
  - EUR/USD
  - GBP/USD
```

Keep the combined list short (~8-10 symbols) so a full scan finishes within
Twelve Data's free-tier rate limit (8 requests/minute).

## Running locally

```bash
cd trading-copilot
pip install -r requirements.txt
export TWELVE_DATA_API_KEY=your_key
export TELEGRAM_BOT_TOKEN=your_token
export TELEGRAM_CHAT_ID=your_chat_id
python -m src.main

# or, to just print signals without sending Telegram messages:
DRY_RUN=true python -m src.main
```

## Backtesting

`src/backtest.py` walks forward through historical candles bar-by-bar and
simulates the exact same scoring logic used live (imported directly from
`strategy.py`, not reimplemented), so results reflect what the bot would
actually have signaled — no lookahead:

- A trade only opens once its signal bar has closed, filled at the **next**
  bar's open.
- It's then walked forward until its stop-loss or take-profit is hit
  (checked against each bar's high/low), or it's force-closed after
  `MAX_HOLD_BARS` (default 60) bars.
- Only one open trade per symbol at a time.

```bash
cd trading-copilot
export TWELVE_DATA_API_KEY=your_key
python -m src.backtest                          # full available history per symbol
python -m src.backtest --start 2024-01-01 --end 2024-12-31
```

Output, per symbol and combined:

| Metric | Meaning |
|---|---|
| `win_rate_pct` | % of trades closed with a positive R-multiple |
| `avg_r` | average result per trade, in multiples of risk (R) |
| `total_r` | sum of all trade R-multiples |
| `profit_factor` | gross winning R / gross losing R (>1 is profitable) |
| `max_drawdown_r` | largest peak-to-trough drop in cumulative R |

Twelve Data's free tier caps historical depth and request volume, so for a
meaningful sample size either backtest one symbol at a time with a long
`--start`/`--end` range, or upgrade your plan.

**Note:** a backtest reflects only its historical sample and doesn't account
for slippage, spread, or how the same setup will trade in unseen conditions.
Treat results as a sanity check on the strategy's logic, not a guarantee of
future performance.

## Disclaimer

This tool produces automated technical-analysis signals for informational
purposes only. It is not financial advice, does not place trades, and
carries no guarantee of profitability. Always do your own research and
manage your own risk.
