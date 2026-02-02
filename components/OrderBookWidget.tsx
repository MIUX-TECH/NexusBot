import React from 'react';
import { OrderBook } from '../types';

interface OrderBookWidgetProps {
  data: OrderBook | null;
}

const OrderBookWidget: React.FC<OrderBookWidgetProps> = ({ data }) => {
  if (!data) return <div className="text-xs text-gray-500 text-center py-4">Memuat Depth...</div>;

  const maxBid = Math.max(...data.bids.map(b => b[1]));
  const maxAsk = Math.max(...data.asks.map(a => a[1]));
  const maxVol = Math.max(maxBid, maxAsk);

  return (
    <div className="w-full flex gap-1 h-32 font-mono text-[10px]">
      <div className="flex-1 flex flex-col justify-end gap-0.5">
        {data.bids.slice(0, 8).map(([price, size], i) => (
          <div key={i} className="flex items-center justify-between relative group">
             <div className="absolute right-0 h-full bg-accent-green/20 z-0" style={{ width: `${(size/maxVol)*100}%` }}></div>
             <span className="z-10 text-gray-400 pl-1">{size.toFixed(4)}</span>
             <span className="z-10 text-accent-green pr-1">{price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-0.5">
        {data.asks.slice(0, 8).map(([price, size], i) => (
          <div key={i} className="flex items-center justify-between relative">
             <div className="absolute left-0 h-full bg-accent-red/20 z-0" style={{ width: `${(size/maxVol)*100}%` }}></div>
             <span className="z-10 text-accent-red pl-1">{price.toFixed(2)}</span>
             <span className="z-10 text-gray-400 pr-1">{size.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderBookWidget;