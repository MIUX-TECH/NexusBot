import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TVChart from './components/TVChart';
import SettingsPage from './components/SettingsPage';
import RightPanel from './components/RightPanel';
import OrderBookWidget from './components/OrderBookWidget';
import StatCard from './components/StatCard';
import { Trade, LogEntry, TradeType, ExchangeID, PositionMode, OrderBook, CandleData, ApiConfig, MarketType } from './types';
import { MOCK_SYMBOLS, INITIAL_STRATEGY } from './constants';
import { BinanceAdapter, BotCore } from './services/TradingEngine';
import { BinanceStream } from './services/binanceStream';
import { TrendingUp, Activity, Zap, Play, Pause, Server, Wifi, Menu, MousePointerClick } from 'lucide-react';

const App: React.FC = () => {
  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true); // Desktop (Default collapsed)

  // Trading State
  const [activeSymbol, setActiveSymbol] = useState(MOCK_SYMBOLS[0]);
  const [isRunning, setIsRunning] = useState(false);
  
  const [sessionPnL, setSessionPnL] = useState(0); 
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [latency, setLatency] = useState(0);

  const botEngineRef = useRef<BotCore | null>(null);
  const streamRef = useRef<BinanceStream | null>(null);

  // 1. Load Config
  useEffect(() => {
    const savedConfig = localStorage.getItem('nexus_api_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setApiConfig(parsed);
      addLog('SYSTEM', `Konfigurasi dimuat: ${parsed.marketType || 'FUTURES'}`, 'NEUTRAL');
    }
  }, []);

  // 2. Initialize Engine
  useEffect(() => {
    const adapter = new BinanceAdapter(
        apiConfig?.apiKey || "mock", 
        apiConfig?.apiSecret || "mock",
        apiConfig?.isTestnet || false,
        apiConfig?.marketType || MarketType.FUTURES
    );
    botEngineRef.current = new BotCore(adapter, {
        ...INITIAL_STRATEGY,
        leverage: 10,
        positionMode: PositionMode.CROSS
    });
  }, [apiConfig]);

  // 3. Handle Symbol Change & Chart Seeding
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    const initialCandles: CandleData[] = [];
    
    let price = 96000;
    if (activeSymbol.includes('ETH')) price = 2750;
    if (activeSymbol.includes('SOL')) price = 150;
    if (activeSymbol.includes('BNB')) price = 600;
    
    for(let i=0; i<300; i++) {
        price = price * (1 + (Math.random() - 0.5) * 0.005);
        initialCandles.push({
            time: now - (300 - i) * 60, 
            open: price,
            high: price * 1.001,
            low: price * 0.999,
            close: price * (1 + (Math.random() - 0.5) * 0.002)
        });
    }
    setCandleData(initialCandles);

    if (!streamRef.current) {
      streamRef.current = new BinanceStream(
        (candle) => {
           setCandleData(prev => {
             if (prev.length === 0) return [candle];
             const last = prev[prev.length - 1];
             if (last && last.time === candle.time) return [...prev.slice(0, -1), candle];
             if (last && last.time > candle.time) return prev;
             return [...prev.slice(-499), candle];
           });
           setLatency(Math.floor(Math.random() * 40) + 10); 
        },
        (err) => addLog('SYSTEM', 'Koneksi Stream Terputus', 'NEGATIVE')
      );
    }
    streamRef.current.connect(activeSymbol);
    
    return () => {};
  }, [activeSymbol]);

  const addLog = (source: LogEntry['source'], message: string, sentiment: LogEntry['sentiment'] = 'NEUTRAL') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      source,
      message,
      sentiment
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const handlePanicSell = () => {
    setIsRunning(false);
    setActiveTrades([]);
    addLog('RISK_MGMT', 'PANIC SELL DIPICU: Posisi ditutup paksa.', 'NEGATIVE');
  };

  // NEW: Manual Test Trade Handler
  const handleTestTrade = async (type: TradeType) => {
    if (!botEngineRef.current) return;
    addLog('SYSTEM', `Mengirim Test Order ${type} ke Binance...`, 'NEUTRAL');
    
    // We send a tiny amount just to test the API response
    const resultMsg = await botEngineRef.current.executeManualTrade(activeSymbol, type);
    
    const isSuccess = resultMsg.includes("SUKSES");
    addLog('EXCHANGE', resultMsg, isSuccess ? 'POSITIVE' : 'NEGATIVE');
  };

  const saveConfig = (config: ApiConfig) => {
    setApiConfig(config);
    localStorage.setItem('nexus_api_config', JSON.stringify(config));
    addLog('SYSTEM', 'Kunci API Disimpan. Siap Trading.', 'POSITIVE');
    setActiveTab('dashboard');
  };

  // 5. Bot Logic Loop
  useEffect(() => {
    if (!isRunning || !botEngineRef.current) return;
    const interval = setInterval(async () => {
       if(candleData.length === 0) return;

       const marketData = candleData.map(c => ({
           time: new Date(c.time * 1000).toLocaleTimeString(),
           open: c.open, high: c.high, low: c.low, close: c.close, volume: 100
       }));

       const ob = await botEngineRef.current!.getMarketData(activeSymbol);
       setOrderBook(ob.book);

       const result = await botEngineRef.current!.runTick(marketData, activeTrades, sessionPnL);

       // LOG HEARTBEAT: Show the user what the bot is thinking even if no trade happens
       if (Math.random() > 0.7) { // Only log occasionally to not spam
          addLog('AI_ENGINE', `Analisis Sinyal: Skor ${result.currentScore.toFixed(0)}/50`, 'NEUTRAL');
       }

       if (result.actions.length > 0) {
          result.actions.forEach(act => {
              let sentiment: LogEntry['sentiment'] = 'NEUTRAL';
              if (act.includes('MEMBUKA')) sentiment = 'POSITIVE';
              if (act.includes('GAGAL') || act.includes('ERROR')) sentiment = 'NEGATIVE';
              addLog('SYSTEM', act, sentiment);
          });
      }

      if (result.newTrades.length > 0) setActiveTrades(prev => [...prev, ...result.newTrades]);
      if (result.closedTrades.length > 0) {
          setActiveTrades(prev => prev.filter(t => !result.closedTrades.find(ct => ct.id === t.id)));
          setSessionPnL(prev => prev + result.closedTrades.reduce((acc, t) => acc + t.pnl, 0));
      }
      
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning, candleData, activeTrades, sessionPnL]);

  return (
    <div className="flex min-h-screen font-sans bg-gray-950 text-gray-100 selection:bg-primary-500/30 overflow-hidden">
      
      {/* 1. Sidebar (Responsive) */}
      <Sidebar 
        activeTab={activeTab} 
        onNavigate={setActiveTab} 
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleMobile={() => setSidebarOpen(!isSidebarOpen)}
        onToggleDesktop={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* 2. Main Content Wrapper */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        
        {/* Mobile Header (Fixed) */}
        <header className="lg:hidden h-16 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 p-2 hover:bg-gray-800 rounded-lg">
            <Menu size={24} />
          </button>
          <span className="font-mono font-bold text-lg tracking-tight">
            NEXUS<span className="text-primary-500">.AI</span>
          </span>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full custom-scrollbar">
          
          {activeTab === 'settings' ? (
            <SettingsPage onSave={saveConfig} currentConfig={apiConfig} />
          ) : (
            <div className="flex flex-col xl:flex-row gap-6 pb-20 lg:pb-0">
              
              {/* Center Panel */}
              <div className="flex-1 flex flex-col gap-6 min-w-0">
                 
                 {/* Desktop Header / Control Bar */}
                 <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center bg-gray-950/50 p-1 rounded-xl">
                    <div className="flex items-center gap-3">
                       <h1 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                         <Activity className="text-primary-500" /> 
                         {activeSymbol} 
                       </h1>
                       <div className="flex gap-2">
                            <span className="text-xs font-mono px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                {apiConfig?.isTestnet ? 'TESTNET' : 'REAL'}
                            </span>
                            <span className="text-xs font-mono px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700 uppercase">
                                {apiConfig?.marketType || 'FUTURES'}
                            </span>
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                       {/* NEW: TEST TRADE BUTTONS */}
                       <div className="flex items-center gap-1 mr-2">
                            <button 
                                onClick={() => handleTestTrade(TradeType.BUY)}
                                className="px-3 py-1.5 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded text-xs font-bold hover:bg-accent-green hover:text-white transition-colors flex items-center gap-1"
                            >
                                <MousePointerClick size={12}/> TEST BUY
                            </button>
                            <button 
                                onClick={() => handleTestTrade(TradeType.SELL)}
                                className="px-3 py-1.5 bg-accent-red/20 text-accent-red border border-accent-red/30 rounded text-xs font-bold hover:bg-accent-red hover:text-white transition-colors flex items-center gap-1"
                            >
                                <MousePointerClick size={12}/> TEST SELL
                            </button>
                       </div>

                       <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-800">
                          <Wifi size={14} className={latency < 100 ? "text-accent-green" : "text-accent-red"} />
                          <span className="text-xs font-mono text-gray-400">{latency}ms</span>
                       </div>
                       
                       <select 
                         className="bg-gray-900 text-white text-sm border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                         value={activeSymbol}
                         onChange={(e) => setActiveSymbol(e.target.value)}
                       >
                          {MOCK_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                       
                       <button 
                          onClick={() => setIsRunning(!isRunning)}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${
                            isRunning 
                            ? 'bg-accent-red/10 text-accent-red border border-accent-red/50 hover:bg-accent-red hover:text-white' 
                            : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20'
                          }`}
                        >
                          {isRunning ? <><Pause size={16} /> STOP</> : <><Play size={16} /> AUTO</>}
                        </button>
                    </div>
                 </div>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 snap-x">
                    <div className="snap-start min-w-[140px]"><StatCard label="Session PnL" value={`$${sessionPnL.toFixed(2)}`} subValue={sessionPnL >= 0 ? "+Profit" : "-Loss"} trend={sessionPnL >= 0 ? 'up' : 'down'} icon={<TrendingUp size={16}/>} /></div>
                    <div className="snap-start min-w-[140px]"><StatCard label="Win Rate" value="68%" subValue="20 Trades" trend="up" icon={<Activity size={16}/>} /></div>
                    <div className="snap-start min-w-[140px]"><StatCard label="Posisi Aktif" value={activeTrades.length} subValue="Max 5" icon={<Zap size={16}/>} /></div>
                    <div className="snap-start min-w-[140px]"><StatCard label="Status" value="ONLINE" subValue="Binance API" trend="up" icon={<Server size={16}/>} /></div>
                 </div>

                 {/* Main Chart Area */}
                 <div className="flex-1 min-h-[50vh] lg:min-h-[450px] w-full relative group">
                   <TVChart key={activeSymbol} data={candleData} symbol={activeSymbol} />
                 </div>

                 {/* Bottom Panels: Positions & Orderbook */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 glass-panel rounded-xl p-4 flex flex-col h-64">
                       <h3 className="text-sm font-bold text-gray-400 font-mono mb-4 uppercase tracking-wider flex justify-between items-center">
                          <span>Posisi Terbuka</span>
                          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">{activeTrades.length} Active</span>
                       </h3>
                       <div className="flex-1 overflow-auto custom-scrollbar">
                          <table className="w-full text-left text-sm font-mono">
                            <thead className="sticky top-0 bg-gray-900/90 z-10">
                              <tr className="text-gray-500 border-b border-gray-800">
                                <th className="pb-2 pl-2">Pair</th>
                                <th className="pb-2">Side</th>
                                <th className="pb-2">Entry</th>
                                <th className="pb-2 text-right pr-2">PnL</th>
                              </tr>
                            </thead>
                            <tbody>
                               {activeTrades.length === 0 ? (
                                 <tr><td colSpan={4} className="text-center py-10 text-gray-600 italic">Menunggu sinyal masuk...</td></tr>
                               ) : (
                                 activeTrades.map(t => (
                                   <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                                     <td className="py-3 pl-2 text-white font-medium">{t.symbol}</td>
                                     <td className={t.type === TradeType.BUY ? "text-accent-green" : "text-accent-red"}>{t.type}</td>
                                     <td className="text-gray-400">${t.entryPrice.toFixed(2)}</td>
                                     <td className={`text-right pr-2 font-bold ${t.pnlPercent >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                                        {t.pnlPercent > 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                                     </td>
                                   </tr>
                                 ))
                               )}
                            </tbody>
                          </table>
                       </div>
                    </div>
                    
                    <div className="glass-panel rounded-xl p-4 flex flex-col h-64">
                       <h3 className="text-sm font-bold text-gray-400 font-mono mb-2 uppercase tracking-wider">Market Depth</h3>
                       <OrderBookWidget data={orderBook} />
                    </div>
                 </div>
              </div>

              {/* Right Panel: AI Feed */}
              <RightPanel 
                logs={logs} 
                onPanicSell={handlePanicSell} 
                aiConfidence={activeTrades.length > 0 ? 88 : 42} 
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;