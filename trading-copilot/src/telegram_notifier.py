"""Send formatted trade signal alerts to a Telegram chat via the Bot API."""

import requests

from .strategy import Signal

TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage"

DIRECTION_EMOJI = {"BUY": "🟢", "SELL": "🔴"}


def format_signal(signal: Signal) -> str:
    emoji = DIRECTION_EMOJI.get(signal.direction, "⚪")
    return (
        f"{emoji} *{signal.direction} SIGNAL* — `{signal.symbol}` ({signal.timeframe})\n"
        f"Confidence: {signal.confidence}% (score {signal.score:+d}/5)\n\n"
        f"Entry: `{signal.entry}`\n"
        f"Stop Loss: `{signal.stop_loss}`\n"
        f"Take Profit: `{signal.take_profit}`\n\n"
        f"RSI(14): {signal.rsi}  |  MACD hist: {signal.macd_hist}\n"
        f"EMA9/21/50: {signal.ema9} / {signal.ema21} / {signal.ema50}\n"
        f"ATR(14): {signal.atr}\n\n"
        f"_Generated {signal.generated_at}_\n\n"
        f"⚠️ Not financial advice — automated technical signal only. Always confirm your own risk management before trading."
    )


def send_message(token: str, chat_id: str, text: str) -> None:
    url = TELEGRAM_API_URL.format(token=token)
    response = requests.post(
        url,
        json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
        timeout=15,
    )
    if not response.ok:
        raise RuntimeError(f"Telegram send failed ({response.status_code}): {response.text}")


def send_signal(token: str, chat_id: str, signal: Signal) -> None:
    send_message(token, chat_id, format_signal(signal))
