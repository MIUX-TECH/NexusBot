import { ExchangeID, MarketData, MarketType, OrderBook, PositionMode, StrategyConfig, Trade, TradeType } from "../types";

/**
 * 1. MODULAR EXCHANGE ADAPTER
 */
export abstract class ExchangeAdapter {
  protected apiKey: string;
  protected secret: string;
  protected isTestnet: boolean;
  protected marketType: MarketType;

  constructor(apiKey: string, secret: string, isTestnet: boolean = false, marketType: MarketType = MarketType.FUTURES) {
    this.apiKey = apiKey;
    this.secret = secret;
    this.isTestnet = isTestnet;
    this.marketType = marketType;
  }

  abstract fetchTicker(symbol: string): Promise<number>;
  abstract fetchOrderBook(symbol: string): Promise<OrderBook>;
  abstract placeOrder(symbol: string, type: TradeType, amount: number, price?: number): Promise<{success: boolean, id?: string, error?: string}>;
}

// Concrete Implementation: Binance
export class BinanceAdapter extends ExchangeAdapter {
  private async hmacSha256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const msgData = encoder.encode(message);
    const cryptoKey = await window.crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, msgData);
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getBaseUrl(): string {
     if (this.marketType === MarketType.SPOT) {
        return this.isTestnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';
     } else {
        return this.isTestnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
     }
  }

  private getProxyBasePath(): string {
    if (this.marketType === MarketType.SPOT) {
      return this.isTestnet ? '/api/binance/spot-testnet' : '/api/binance/spot';
    }
    return this.isTestnet ? '/api/binance/futures-testnet' : '/api/binance/futures';
  }

  async fetchTicker(symbol: string): Promise<number> {
    // For now we rely on the websocket stream for price updates to keep it fast
    return new Promise(resolve => resolve(0)); 
  }

  async fetchOrderBook(symbol: string): Promise<OrderBook> {
    // Simplified simulation for order book to reduce API load
    const basePrice = 50000 + (Math.random() * 100);
    return {
      bids: Array.from({length: 5}, (_, i) => [basePrice - (i * 5), Math.random() * 2]),
      asks: Array.from({length: 5}, (_, i) => [basePrice + (i * 5), Math.random() * 2]),
      timestamp: Date.now()
    };
  }

  // UPDATED: Uses Vite dev server proxy to avoid CORS in local app
  async placeOrder(symbol: string, type: TradeType, amount: number, price?: number): Promise<{success: boolean, id?: string, error?: string}> {
    
    if (this.apiKey === 'mock' || !this.apiKey) {
        return { success: true, id: `SIM_${Date.now()}` };
    }

    try {
        const baseUrl = this.getProxyBasePath();
        const endpoint = this.marketType === MarketType.SPOT ? '/api/v3/order' : '/fapi/v1/order';
        
        const timestamp = Date.now();
        // Adjust quantity logic as needed
        let quantity = amount; 
        
        let queryParams = `symbol=${symbol.replace('/','').replace('-','')}&side=${type}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
        
        const signature = await this.hmacSha256(this.secret, queryParams);
        const targetUrl = `${baseUrl}${endpoint}?${queryParams}&signature=${signature}`;

        console.log(`[BinanceAdapter] Requesting order via local proxy: ${symbol}`);

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 
            'X-MBX-APIKEY': this.apiKey
          }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.msg || errorData.error || `HTTP ${response.status}` };
        }

        const data = await response.json();
        
        // Final check on Binance data structure
        if (data.code && data.msg) {
             return { success: false, error: `Binance Error: ${data.msg}` };
        }

        return { success: true, id: data.orderId };

    } catch (e: any) {
        console.error("Proxy Error:", e);
        return { success: false, error: "Gagal terhubung ke proxy lokal. Pastikan Vite dev server berjalan." };
    }
  }
}

/**
 * 2. SIGNAL ENGINE
 */
export class SignalEngine {
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    let gains = 0; let losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / period; const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  static calculateMACD(prices: number[]): { histogram: number, signal: string } {
    const shortEMA = this.calculateEMA(prices, 12);
    const longEMA = this.calculateEMA(prices, 26);
    const macdLine = shortEMA - longEMA;
    const signalLine = macdLine * 0.9; 
    const histogram = macdLine - signalLine;
    return { histogram, signal: histogram > 0 ? 'BULLISH' : 'BEARISH' };
  }

  static calculateEMA(prices: number[], period: number): number {
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) { ema = prices[i] * k + ema * (1 - k); }
    return ema;
  }

  static analyzeOrderBook(book: OrderBook): number {
    const bidVol = book.bids.reduce((acc, val) => acc + val[1], 0);
    const askVol = book.asks.reduce((acc, val) => acc + val[1], 0);
    return (bidVol / (bidVol + askVol)) * 100; 
  }

  static getConfidenceScore(marketData: MarketData[], orderBook: OrderBook, strategy: StrategyConfig): { score: number, reasoning: string[] } {
    const closes = marketData.map(d => d.close);
    const rsi = this.calculateRSI(closes, strategy.rsiPeriod);
    const macd = this.calculateMACD(closes);
    const obImbalance = this.analyzeOrderBook(orderBook);
    
    let score = 50;
    const reasoning: string[] = [];

    if (rsi < strategy.rsiOversold) { score += 20; reasoning.push(`RSI Oversold (${rsi.toFixed(1)})`); } 
    else if (rsi > strategy.rsiOverbought) { score -= 20; reasoning.push(`RSI Overbought (${rsi.toFixed(1)})`); }

    if (macd.signal === 'BULLISH') { score += 15; reasoning.push("MACD Crossover Bullish"); } 
    else { score -= 15; reasoning.push("MACD Bearish"); }

    if (obImbalance > 60) { score += 10; reasoning.push("Orderbook Bullish"); } 
    else if (obImbalance < 40) { score -= 10; reasoning.push("Orderbook Bearish"); }

    return { score: Math.max(0, Math.min(100, score)), reasoning };
  }
}

/**
 * 3. TRADE REPOSITORY
 */
export class TradeRepository {
  private trades: Trade[] = [];
  async save(trade: Trade): Promise<void> { this.trades.push(trade); }
}

/**
 * 4. BOT CORE
 */
export class BotCore {
  private exchange: ExchangeAdapter;
  private db: TradeRepository;
  private config: StrategyConfig;

  constructor(exchange: ExchangeAdapter, config: StrategyConfig) {
    this.exchange = exchange;
    this.config = config;
    this.db = new TradeRepository();
  }

  public async getMarketData(symbol: string): Promise<{price: number, book: OrderBook}> {
    const price = await this.exchange.fetchTicker(symbol);
    const book = await this.exchange.fetchOrderBook(symbol);
    return { price, book };
  }

  // NEW: Manual Trade Execution Wrapper
  public async executeManualTrade(symbol: string, type: TradeType): Promise<string> {
      // 0.002 BTC/ETH allows passing minNotional limits on most pairs
      const amount = symbol.includes('BTC') ? 0.001 : 0.01; 
      const result = await this.exchange.placeOrder(symbol, type, amount);
      if (result.success) {
          return `SUKSES: Order ${type} terkirim. ID: ${result.id}`;
      } else {
          return `GAGAL: ${result.error}`;
      }
  }

  public async runTick(
    marketDataHistory: MarketData[], 
    activeTrades: Trade[], 
    currentSessionPnL: number 
  ): Promise<{ 
    actions: string[], 
    newTrades: Trade[], 
    closedTrades: Trade[], 
    updatedPnL: number,
    currentScore: number // EXPOSE SCORE
  }> {
    const currentPrice = marketDataHistory[marketDataHistory.length - 1].close;
    const orderBook = await this.exchange.fetchOrderBook("BTC/USDT"); 

    const actions: string[] = [];
    let updatedPnL = currentSessionPnL;
    const newTrades: Trade[] = [];
    const closedTrades: Trade[] = [];
    
    // Get Analysis
    const { score, reasoning } = SignalEngine.getConfidenceScore(marketDataHistory, orderBook, this.config);

    // 1. Manage Active Trades
    const ongoingTrades = activeTrades.map(trade => {
        let status: 'OPEN' | 'CLOSED' = 'OPEN';
        const pnlRaw = trade.type === TradeType.BUY 
            ? (currentPrice - trade.entryPrice) / trade.entryPrice
            : (trade.entryPrice - currentPrice) / trade.entryPrice;
        
        const pnlPercent = pnlRaw * 100 * this.config.leverage;
        const pnlValue = trade.amount * pnlRaw; 

        if (pnlPercent <= -this.config.stopLoss || pnlPercent >= this.config.takeProfit) {
            status = 'CLOSED';
            updatedPnL += pnlValue;
            actions.push(`RISK_MGMT: Menutup posisi ${trade.symbol} (${pnlPercent.toFixed(2)}%)`);
            const closedTrade = { ...trade, status: 'CLOSED' as const, pnl: pnlValue, pnlPercent, currentPrice };
            this.db.save(closedTrade);
            closedTrades.push(closedTrade);
        }
        return { ...trade, currentPrice, pnl: pnlValue, pnlPercent, status };
    }).filter(t => t.status === 'OPEN');

    // 2. Scan for New Opportunities
    if (ongoingTrades.length === 0) {
        if (score >= this.config.aiConfidenceThreshold) {
            const size = 100 * this.config.leverage; // Mock size
            
            let finalType: TradeType | null = null;
            if (score >= 60) finalType = TradeType.BUY; // Lowered logic
            if (score <= 40) finalType = TradeType.SELL;

            if (finalType) {
                // Hardcoded tiny amount to test execution
                const quantity = 0.001; 
                const execResult = await this.exchange.placeOrder("BTCUSDT", finalType, quantity);

                if (execResult.success) {
                    const newTrade: Trade = {
                        id: execResult.id || `SIM_${Date.now()}`,
                        symbol: "BTC/USDT",
                        exchange: ExchangeID.BINANCE,
                        type: finalType,
                        entryPrice: currentPrice,
                        currentPrice: currentPrice,
                        amount: size,
                        pnl: 0,
                        pnlPercent: 0,
                        leverage: this.config.leverage,
                        timestamp: Date.now(),
                        status: 'OPEN',
                        mode: this.config.positionMode,
                        confidenceAtEntry: score,
                        aiReasoning: reasoning.join(", ")
                    };
                    newTrades.push(newTrade);
                    actions.push(`AI_ENGINE: MEMBUKA POSISI ${finalType} (Skor: ${score}%)`);
                } else {
                    actions.push(`EXEC ERROR: ${execResult.error}`);
                }
            }
        }
    }

    return { actions, newTrades, closedTrades, updatedPnL, currentScore: score };
  }
}
