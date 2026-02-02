import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { CandleData } from '../types';

interface TVChartProps {
  data: CandleData[];
  symbol: string;
}

const TVChart: React.FC<TVChartProps> = ({ data, symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#374151',
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Observer for resizing
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      if (chartRef.current) {
        chartRef.current.applyOptions({ width: newRect.width, height: newRect.height });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
    };
  }, []);

  // Update Data
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || data.length === 0) return;

    try {
        const series = seriesRef.current;
        
        // Remove duplicates and sort by time to prevent Lightweight Charts errors
        const uniqueDataMap = new Map();
        data.forEach(item => uniqueDataMap.set(item.time, item));
        const sortedData = Array.from(uniqueDataMap.values()).sort((a, b) => a.time - b.time);

        // If it's a full history load (more than 2 candles), use setData
        // Otherwise use update for live ticks
        if (sortedData.length > 2) {
            series.setData(sortedData);
            // Only fit content on initial load or symbol change
            if (data.length > 50) {
                chartRef.current.timeScale().fitContent();
            }
        } else {
             // Update the last candle or add new one
             const lastCandle = sortedData[sortedData.length - 1];
             series.update(lastCandle);
        }
    } catch (err) {
        console.error("Chart render error:", err);
    }
  }, [data]);

  return (
    <div className="w-full h-full min-h-[400px] glass-panel rounded-xl flex flex-col relative overflow-hidden shadow-2xl">
      <div className="absolute top-4 left-4 z-10 flex flex-col pointer-events-none">
        <h2 className="text-2xl font-bold text-white font-mono tracking-tight drop-shadow-md">{symbol}</h2>
        <div className="flex items-center gap-2 mt-1">
             <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
             <span className="text-xs text-gray-400 font-mono">LIVE FEED • BINANCE</span>
        </div>
      </div>
      {/* Ensure width/height 100% to fill container */}
      <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default TVChart;