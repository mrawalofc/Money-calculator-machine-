import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { CATEGORY_COLORS, Language, Category } from '../types';
import { getTranslation } from '../translations';
import { useMemo, useState } from 'react';
import { format, subDays, startOfMonth, startOfWeek, startOfYear, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, isSameDay, isSameMonth, isSameWeek, isSameYear, subMonths, eachYearOfInterval, subYears } from 'date-fns';
import { CategoryIcon } from './CategoryIcon';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'motion/react';

interface ChartsSectionProps {
  categoryData: { name: string; value: number }[];
  transactions: any[];
  currencySymbol?: string;
  language?: Language;
  previousCategoryData?: Record<Category, number>;
}

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const ChartsSection = ({ categoryData, transactions, currencySymbol = '$', language = 'en', previousCategoryData = {} as Record<Category, number> }: ChartsSectionProps) => {
  const [range, setRange] = useState<TimeRange>('daily');
  const t = (key: any) => getTranslation(language, key);

  const totalSpending = useMemo(() => categoryData.reduce((acc, curr) => acc + curr.value, 0), [categoryData]);

  const sortedCategories = useMemo(() => {
    return [...categoryData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Main top 5 for the sidebar/legend
  }, [categoryData]);

  const trendData = useMemo(() => {
    const now = new Date();
    // ... (rest of trendData logic remains same)
    let interval: { start: Date; end: Date };
    let formatter: (date: Date) => string;
    let comparator: (d1: Date, d2: Date) => boolean;

    switch (range) {
      case 'daily':
        interval = { start: subDays(now, 6), end: now };
        formatter = (d) => format(d, 'dd');
        comparator = isSameDay;
        break;
      case 'weekly':
        interval = { start: subDays(now, 28), end: now };
        formatter = (d) => `W${format(d, 'w')}`;
        comparator = isSameWeek;
        break;
      case 'monthly':
        interval = { start: subMonths(now, 5), end: now };
        formatter = (d) => format(d, 'MMM');
        comparator = isSameMonth;
        break;
      case 'yearly':
        interval = { start: subYears(now, 4), end: now };
        formatter = (d) => format(d, 'yyyy');
        comparator = isSameYear;
        break;
      default:
        interval = { start: subDays(now, 6), end: now };
        formatter = (d) => format(d, 'dd');
        comparator = isSameDay;
    }

    let points: Date[];
    if (range === 'daily') points = eachDayOfInterval(interval);
    else if (range === 'weekly') points = eachWeekOfInterval(interval);
    else if (range === 'monthly') points = eachMonthOfInterval(interval);
    else points = eachYearOfInterval(interval);

    return points.map(point => {
      const pointTransactions = transactions.filter(tr => {
        const trDate = new Date(tr.date);
        return comparator(trDate, point);
      });

      return {
        label: formatter(point),
        income: pointTransactions
          .filter(tr => tr.type === 'income' || tr.type === 'borrowed')
          .reduce((acc, tr) => acc + tr.amount, 0),
        expense: pointTransactions
          .filter(tr => tr.type === 'expense' || tr.type === 'lent')
          .reduce((acc, tr) => acc + tr.amount, 0)
      };
    });
  }, [transactions, range]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 flex-1 min-h-0 py-2">
      {/* Category Breakdown */}
      <div className="lg:col-span-12 xl:col-span-5 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h4 className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{t('spendingCategories' as any) || 'Spending Categories'}</h4>
        </div>
        
        <div className="flex flex-col md:flex-row xl:flex-col gap-8 flex-1 min-h-0">
          <div className="w-full md:w-1/2 xl:w-full aspect-square md:aspect-auto md:h-[200px] xl:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius="65%"
                  outerRadius="95%"
                  stroke="none"
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#6366f1'}
                      className="hover:opacity-80 transition-opacity outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(28, 28, 30, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-3 pr-2 overflow-y-auto custom-scrollbar">
            {sortedCategories.map((cat) => {
              const prevValue = previousCategoryData[cat.name as Category] || 0;
              const currentValue = cat.value;
              const diff = currentValue - prevValue;
              const percentOfTotal = totalSpending > 0 ? (currentValue / totalSpending) * 100 : 0;
              
              return (
                <motion.div 
                  key={cat.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${CATEGORY_COLORS[cat.name as Category]}15`, color: CATEGORY_COLORS[cat.name as Category] }}
                    >
                      <CategoryIcon category={cat.name as Category} size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">{cat.name}</p>
                      <p className="text-[9px] text-white/30 font-medium">{percentOfTotal.toFixed(1)}% of total</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-white">{currencySymbol}{currentValue.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {diff > 0 ? (
                        <div className="flex items-center gap-0.5 text-rose-400">
                          <TrendingUp size={8} />
                          <span className="text-[8px] font-bold uppercase">Up</span>
                        </div>
                      ) : diff < 0 ? (
                        <div className="flex items-center gap-0.5 text-emerald-400">
                          <TrendingDown size={8} />
                          <span className="text-[8px] font-bold uppercase">Down</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 text-white/20">
                          <Minus size={8} />
                          <span className="text-[8px] font-bold uppercase">Flat</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Bar Chart */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h4 className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{t('performance' as any) || 'Financial Performance'}</h4>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  range === r ? 'bg-indigo-500 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {r === 'daily' ? (language === 'bn' ? 'দৈনিক' : 'Daily') :
                 r === 'weekly' ? (language === 'bn' ? 'সাপ্তাহিক' : 'Weekly') :
                 r === 'monthly' ? (language === 'bn' ? 'মাসিক' : 'Monthly') :
                 (language === 'bn' ? 'বার্ষিক' : 'Yearly')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} barGap={6}>
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 600 }} 
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                contentStyle={{ backgroundColor: 'rgba(28, 28, 30, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
                formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`}
              />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 4, 4]} barSize={range === 'daily' ? 12 : 24} />
              <Bar dataKey="income" fill="#34d399" radius={[4, 4, 4, 4]} barSize={range === 'daily' ? 12 : 24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
