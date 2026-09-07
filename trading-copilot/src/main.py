"""Entry point: scan the watchlist, run the strategy, alert Telegram on signals.

Required environment variables:
    TWELVE_DATA_API_KEY   - free key from https://twelvedata.com
    TELEGRAM_BOT_TOKEN    - from @BotFather
    TELEGRAM_CHAT_ID      - your user/group/channel chat id

Optional:
    DRY_RUN=true          - print signals to stdout instead of sending Telegram messages
"""

import os
import sys
import time

import yaml

from . import data_provider, strategy, telegram_notifier

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "watchlist.yaml")
REQUEST_DELAY_SECONDS = 8  # stays under Twelve Data's free-tier 8 requests/minute limit


def load_watchlist():
    with open(CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)
    symbols = list(config.get("stocks", [])) + list(config.get("forex", []))
    return symbols, config.get("interval", "1h"), config.get("lookback", 150)


def main() -> int:
    api_key = os.environ.get("TWELVE_DATA_API_KEY")
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    dry_run = os.environ.get("DRY_RUN", "false").lower() == "true"

    if not api_key:
        print("ERROR: TWELVE_DATA_API_KEY is not set.", file=sys.stderr)
        return 1
    if not dry_run and (not bot_token or not chat_id):
        print("ERROR: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set (or use DRY_RUN=true).", file=sys.stderr)
        return 1

    symbols, interval, lookback = load_watchlist()
    print(f"Scanning {len(symbols)} symbols on {interval} candles...")

    signals_found = 0
    for i, symbol in enumerate(symbols):
        try:
            df = data_provider.fetch_candles(symbol, interval, lookback, api_key)
            signal = strategy.evaluate(symbol, df, interval)
            if signal:
                signals_found += 1
                message = telegram_notifier.format_signal(signal)
                print(f"\n--- SIGNAL: {symbol} ---\n{message}\n")
                if not dry_run:
                    telegram_notifier.send_message(bot_token, chat_id, message)
            else:
                print(f"{symbol}: no setup (below confluence threshold)")
        except data_provider.DataProviderError as e:
            print(f"WARN: skipping {symbol} — {e}", file=sys.stderr)
        except Exception as e:  # noqa: BLE001 - keep scanning other symbols
            print(f"WARN: unexpected error on {symbol} — {e}", file=sys.stderr)

        if i < len(symbols) - 1:
            time.sleep(REQUEST_DELAY_SECONDS)

    print(f"\nScan complete. {signals_found} signal(s) found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
