import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, trend, icon }) => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 flex flex-col justify-between hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-xs font-mono uppercase tracking-wider">{label}</span>
        {icon && <div className="text-gray-600">{icon}</div>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white font-mono">{value}</span>
        {subValue && (
          <span className={`text-xs font-mono mb-1 ${
            trend === 'up' ? 'text-accent-green' : 
            trend === 'down' ? 'text-accent-red' : 'text-gray-500'
          }`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;