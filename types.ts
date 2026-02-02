
export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum MarketType {
  SPOT = 'SPOT',
  FUTURES = 'FUTURES'
}

export enum ExchangeID {
  BINANCE = 'BINANCE',
  OKX = 'OKX',
  HYPERLIQUID = 'HYPERLIQUID'
}

export enum PositionMode {
  CROSS = 'CROSS',
  ISOLATED = 'ISOLATED'
}

export interface OrderBook {
  bids: [number, number][]; // [price, size]
  asks: [number, number][]; // [price, size]
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  exchange: ExchangeID;
  type: TradeType;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  timestamp: number;
  status: 'OPEN' | 'CLOSED';
  mode: PositionMode;
  confidenceAtEntry: number;
  aiReasoning: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  source: 'SYSTEM' | 'AI_ENGINE' | 'EXCHANGE' | 'RISK_MGMT';
  message: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface MarketData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

// For Lightweight Charts
export interface CandleData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface StrategyConfig {
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  macdFast: number;
  macdSlow: number;
  riskPerTrade: number; // percentage
  stopLoss: number; // percentage
  takeProfit: number; // percentage
  aiConfidenceThreshold: number; // 0-100
  leverage: number;
  positionMode: PositionMode;
}

export interface ApiConfig {
  apiKey: string;
  apiSecret: string;
  geminiApiKey?: string;
  isTestnet: boolean;
  marketType: MarketType; 
  exchange: ExchangeID;
  // Requests are proxied via Vite dev server for local use.
}
