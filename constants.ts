import { StrategyConfig, PositionMode } from './types';

export const INITIAL_STRATEGY: StrategyConfig = {
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  macdFast: 12,
  macdSlow: 26,
  riskPerTrade: 1.5,
  stopLoss: 2.0,
  takeProfit: 4.5,
  // LOWERED FROM 85 TO 50 FOR TESTING
  aiConfidenceThreshold: 50, 
  leverage: 10,
  positionMode: PositionMode.CROSS
};

export const MOCK_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];

export const INITIAL_BALANCE = 50000; // USDT