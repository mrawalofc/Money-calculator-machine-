import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { GlassCard } from './ui/GlassCard';
import { TrendingUp, BarChart as BarIcon, Target } from 'lucide-react';

interface BudgetTrendsProps {
  historicalData: any[];
  currencySymbol: string;
}

export const BudgetTrends = ({ historicalData, currencySymbol }: BudgetTrendsProps) => {
  const chartData = [...historicalData].reverse().map(m => ({
    name: m.label,
    spent: m.totalSpent,
    limit: m.totalLimit,
    ratio: m.totalLimit > 0 ? (m.totalSpent / m.totalLimit) * 100 : 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1C1C1E] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-white flex items-center justify-between gap-6">
              <span className="opacity-40 font-medium">Spent:</span>
              {currencySymbol}{payload[0].value.toLocaleString()}
            </p>
            <p className="text-[11px] font-bold text-indigo-400 flex items-center justify-between gap-6">
              <span className="opacity-40 font-medium">Budget:</span>
              {currencySymbol}{payload[1].value.toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GlassCard className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Spending vs Budget</h4>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Last 6 Months</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="spent" 
                stroke="#6366F1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSpent)" 
              />
              <Area 
                type="monotone" 
                dataKey="limit" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <BarIcon size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Budget Utilization</h4>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Percentage of limit used</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
                dx={-10}
                unit="%"
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#1C1C1E] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{label}</p>
                        <p className="text-[11px] font-bold text-white flex items-center justify-between gap-6">
                           Utilization:
                          <span className={`${(payload[0].value as number) > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {(payload[0].value as number).toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="ratio" radius={[12, 12, 4, 4]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.ratio > 100 ? '#F43F5E' : '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
};
