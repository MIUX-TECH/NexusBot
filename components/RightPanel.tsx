import React from 'react';
import { LogEntry } from '../types';
import TradeLog from './TradeLog';
import { AlertOctagon, BrainCircuit } from 'lucide-react';

interface RightPanelProps {
  logs: LogEntry[];
  onPanicSell: () => void;
  aiConfidence: number;
}

const RightPanel: React.FC<RightPanelProps> = ({ logs, onPanicSell, aiConfidence }) => {
  return (
    <div className="w-full xl:w-80 flex flex-col gap-4 shrink-0">
      {/* AI Confidence Widget */}
      <div className="glass-panel p-5 rounded-xl border-t-4 border-t-primary-500">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <BrainCircuit className="text-primary-400 animate-pulse-slow" size={20} />
             <h3 className="text-sm font-bold text-white font-mono tracking-wider">AI SENTIMENT</h3>
           </div>
           <span className={`text-xs px-2 py-1 rounded font-bold border ${aiConfidence > 60 ? 'bg-accent-green/10 border-accent-green text-accent-green' : aiConfidence < 40 ? 'bg-accent-red/10 border-accent-red text-accent-red' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
             {aiConfidence > 60 ? 'BULLISH' : aiConfidence < 40 ? 'BEARISH' : 'NEUTRAL'}
           </span>
        </div>
        
        <div className="relative pt-2">
          <div className="flex justify-between text-xs text-gray-500 font-mono mb-1">
            <span>BEAR</span>
            <span>BULL</span>
          </div>
          <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-700 ease-out ${aiConfidence > 60 ? 'bg-gradient-to-r from-emerald-600 to-accent-green' : 'bg-gradient-to-r from-red-600 to-accent-red'}`} 
              style={{ width: `${aiConfidence}%` }}
            />
          </div>
          <div className="mt-2 text-right">
             <span className="text-2xl font-bold text-white font-mono">{aiConfidence}</span>
             <span className="text-xs text-gray-500 ml-1">/ 100</span>
          </div>
        </div>
      </div>

      {/* Logs Section - Takes remaining height on desktop */}
      <div className="flex-1 min-h-[300px] flex flex-col glass-panel rounded-xl overflow-hidden">
        <TradeLog logs={logs} />
      </div>

      {/* Panic Button */}
      <div className="glass-panel p-4 rounded-xl border border-red-900/30 bg-red-950/20">
        <button 
          onClick={onPanicSell}
          className="w-full bg-gradient-to-r from-red-700 to-accent-red hover:from-red-600 hover:to-red-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
        >
          <AlertOctagon className="group-hover:animate-ping" size={18} />
          DARURAT: JUAL SEMUA
        </button>
        <p className="text-[10px] text-red-400/60 text-center mt-2 font-mono uppercase">
          Tindakan ini tidak dapat dibatalkan
        </p>
      </div>
    </div>
  );
};

export default RightPanel;