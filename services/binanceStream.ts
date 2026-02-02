import { CandleData } from "../types";

export class BinanceStream {
  private ws: WebSocket | null = null;
  private symbol: string = 'btcusdt';
  private interval: string = '1m';
  private onUpdate: (candle: CandleData) => void;
  private onError: (err: Event) => void;

  constructor(
    onUpdate: (candle: CandleData) => void,
    onError: (err: Event) => void
  ) {
    this.onUpdate = onUpdate;
    this.onError = onError;
  }

  public connect(symbol: string) {
    if (this.ws) {
      this.ws.close();
    }

    this.symbol = symbol.toLowerCase().replace('/', '');
    // Using Binance public stream
    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`);

    this.ws.onopen = () => {
      console.log(`[BinanceStream] Connected to ${this.symbol}`);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.k) {
        const kline = message.k;
        const candle: CandleData = {
          time: Math.floor(kline.t / 1000) as number, // lightweight-charts expects seconds
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        this.onUpdate(candle);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[BinanceStream] Error:', err);
      this.onError(err);
    };

    this.ws.onclose = () => {
      console.log('[BinanceStream] Disconnected');
    };
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}