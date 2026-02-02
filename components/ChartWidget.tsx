import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { MarketData } from '../types';

interface ChartWidgetProps {
  data: MarketData[];
  symbol: string;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ data, symbol }) => {
  const [timeframe, setTimeframe] = useState('1H');
  const currentPrice = data[data.length - 1]?.close || 0;
  const isUp = currentPrice >= (data[data.length - 2]?.close || 0);

  return (
    <div className="w-full h-full min-h-[400px] bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 flex flex-col overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white font-mono">{symbol}</h2>
          <span className={`text-sm font-mono px-2 py-0.5 rounded ${isUp ? 'text-accent-green bg-accent-green/10' : 'text-accent-red bg-accent-red/10'}`}>
            ${currentPrice.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500 font-mono hidden sm:inline-block">Interval: {timeframe}</span>
        </div>
        <div className="flex gap-2">
            {['1H', '4H', '1D', '1W'].map((tf) => (
                <button 
                  key={tf} 
                  onClick={() => setTimeframe(tf)}
                  className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                    timeframe === tf 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-500 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                    {tf}
                </button>
            ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? "#10B981" : "#EF4444"} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isUp ? "#10B981" : "#EF4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis 
                dataKey="time" 
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} 
                axisLine={false}
                tickLine={false}
            />
            <YAxis 
                domain={['auto', 'auto']} 
                orientation="right"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '11px' }}
            />
            <Area 
                type="monotone" 
                dataKey="close" 
                stroke={isUp ? "#10B981" : "#EF4444"} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

       <div className="h-16 border-t border-gray-800 bg-gray-900/30">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <Bar dataKey="volume" fill="#374151" opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
};

export default ChartWidget;