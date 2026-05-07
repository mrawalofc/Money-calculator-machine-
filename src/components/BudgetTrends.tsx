import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { Target, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Category, CATEGORY_COLORS } from '../types';

interface BudgetTrendsProps {
  historicalData: any[];
  currencySymbol: string;
}

export const BudgetTrends = ({ historicalData, currencySymbol }: BudgetTrendsProps) => {
  // Process data for the trends chart
  const trendData = useMemo(() => {
    return [...historicalData].reverse().map(month => ({
      name: month.label,
      spent: month.totalSpent,
      limit: month.totalLimit,
      performance: month.totalLimit > 0 ? (month.totalSpent / month.totalLimit) * 100 : 0
    }));
  }, [historicalData]);

  // Process data for category comparison (most recent month)
  const currentMonthCategories = useMemo(() => {
    if (historicalData.length === 0) return [];
    return historicalData[0].performance.map((p: any) => ({
      name: p.category,
      spent: p.spent,
      limit: p.limit,
      percent: p.percent
    })).sort((a: any, b: any) => b.spent - a.spent);
  }, [historicalData]);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-white/[0.02] border border-white/5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Avg. Monthly Spent</span>
          </div>
          <p className="text-xl font-bold text-white">
            {currencySymbol}{Math.round(trendData.reduce((acc, d) => acc + d.spent, 0) / (trendData.length || 1)).toLocaleString()}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-3xl bg-white/[0.02] border border-white/5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Target size={18} />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Avg. Budget Usage</span>
          </div>
          <p className="text-xl font-bold text-white">
            {Math.round(trendData.reduce((acc, d) => acc + d.performance, 0) / (trendData.length || 1))}%
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-3xl bg-white/[0.02] border border-white/5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle size={18} />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Months Over Limit</span>
          </div>
          <p className="text-xl font-bold text-white">
            {trendData.filter(d => d.spent > d.limit && d.limit > 0).length} / {trendData.length}
          </p>
        </motion.div>
      </div>

      {/* Spending vs Limit Trend */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 rounded-3xl bg-white/[0.02] border border-white/5"
      >
        <div className="mb-6">
          <h3 className="text-sm font-bold text-white mb-1">Total Spending vs. Budget Limit</h3>
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">6-Month Trend Analysis</p>
        </div>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#ffffff20" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
              />
              <YAxis 
                stroke="#ffffff20" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${currencySymbol}${value}`}
                tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1C1C1E', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px',
                  fontSize: '12px'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="spent" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSpent)" 
                name="Total Spent"
              />
              <Area 
                type="monotone" 
                dataKey="limit" 
                stroke="#ffffff20" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent" 
                name="Budget Limit"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Wise Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-3xl bg-white/[0.02] border border-white/5"
        >
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white mb-1">Category Spending Comparison</h3>
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Current Month Distribution</p>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentMonthCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#ffffff40" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                  tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1C1C1E', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '16px' 
                  }} 
                />
                <Bar dataKey="spent" radius={[0, 4, 4, 0]} name="Spent">
                  {currentMonthCategories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-3xl bg-white/[0.02] border border-white/5"
        >
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white mb-1">Budget Burn Rate</h3>
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Efficiency by Category</p>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {currentMonthCategories.map((item: any) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-white/80">{item.name}</span>
                  <span className={item.percent > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                    {Math.round(item.percent)}% Used
                  </span>
                </div>
                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                      item.percent > 100 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    }`}
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                  {item.percent > 100 && (
                    <div 
                      className="absolute top-0 left-0 h-full bg-rose-400/30 animate-pulse"
                      style={{ width: `${Math.min(item.percent, 100)}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
            {currentMonthCategories.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[200px] text-white/20">
                <Target size={40} className="mb-2 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-widest text-center">No budget data for this month</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
