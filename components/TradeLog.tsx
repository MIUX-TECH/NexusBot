import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { BrainCircuit, Terminal } from 'lucide-react';

interface TradeLogProps {
  logs: LogEntry[];
}

const TradeLog: React.FC<TradeLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/80">
        <div className="flex items-center gap-2 text-primary-400">
          <BrainCircuit size={18} />
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider">Proses Berpikir AI</h3>
        </div>
        <div className="w-2 h-2 rounded-full bg-accent-green animate-ping" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 relative">
        {logs.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-700 pointer-events-none">
                <span className="flex items-center gap-2">
                    <Terminal size={14} /> Menunggu sinyal pasar...
                </span>
            </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-gray-600 whitespace-nowrap">
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]
            </span>
            <div className="flex-1 break-words">
              <span className={`font-bold mr-2 ${
                log.source === 'AI_ENGINE' ? 'text-primary-400' :
                log.source === 'EXCHANGE' ? 'text-accent-cyan' : 'text-gray-400'
              }`}>
                {log.source}:
              </span>
              <span className={`${
                log.sentiment === 'POSITIVE' ? 'text-accent-green' :
                log.sentiment === 'NEGATIVE' ? 'text-accent-red' :
                'text-gray-300'
              }`}>
                {log.message}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TradeLog;