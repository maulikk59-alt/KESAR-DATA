import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';
import { THRESHOLDS, ProductionEntry, InwardEntry, FinishedStockState, SalesEntry } from '../types';
import { Droplet, Layers, Package, Coins } from 'lucide-react';

interface DashboardProps {
  stats: any;
  logs: ProductionEntry[];
  inwardLogs: InwardEntry[];
  sales: SalesEntry[];
}

const Card = ({ title, value, unit, subtext, color = "bg-white dark:bg-slate-800", icon: Icon }: any) => (
  <div className={`${color} p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{typeof value === 'number' ? value.toLocaleString() : value}<span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">{unit}</span></h3>
        {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
      </div>
      {Icon && <Icon className="w-5 h-5 text-slate-400" />}
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ stats, logs, inwardLogs, sales }) => {
  const stock: FinishedStockState = stats.finishedStock;

  const chartData = logs
    .slice(-7)
    .map(log => ({
      date: log.dateStr.slice(5),
      yield: parseFloat(log.oilYieldPercent.toFixed(1)),
      loss: parseFloat(log.processLossPercent.toFixed(1)),
      supervisor: log.supervisorName
    }));

  const isYieldCritical = stats.today.avgYield < THRESHOLDS.MIN_OIL_YIELD && stats.today.avgYield > 0;

  const recentInward = [...inwardLogs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSales = sales.filter(s => s.dateStr.startsWith(todayStr))
                          .reduce((sum, s) => sum + (s.totalValue || 0), 0);

  const salesByDay = sales
      .reduce((acc, sale) => {
        const date = sale.dateStr.split('T')[0];
        const value = sale.totalValue || 0;
        const existing = acc.find(d => d.date === date);
        if (existing) {
          existing.sales += value;
        } else {
          acc.push({ date, sales: value });
        }
        return acc;
      }, [] as { date: string; sales: number }[])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const last7DaysSales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = salesByDay.find(s => s.date === dateStr);
      last7DaysSales.push({
        date: dateStr.slice(5),
        Sales: dayData ? dayData.sales : 0,
      });
    }


  return (
    <div className="space-y-6 pb-20">
      
      <div className="grid grid-cols-2 gap-3">
         <Card 
          title="Oil Stock" 
          value={stock.oilStockKg} 
          unit="Kg" 
          color="bg-amber-50 dark:bg-amber-900/50 border-amber-100 dark:border-amber-800"
          icon={Droplet}
          subtext="Ready for dispatch"
        />
        <Card 
          title="Cake Stock" 
          value={stock.cakeStockKg} 
          unit="Kg" 
          color="bg-stone-50 dark:bg-stone-900/50 border-stone-100 dark:border-stone-800"
          icon={Layers}
          subtext="Ready for dispatch"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Production Pulse</h2>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full animate-pulse">LIVE</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card 
          title="Avg Oil Yield" 
          value={stats.today.avgYield.toFixed(1)} 
          unit="%" 
          color={isYieldCritical ? "bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800" : "bg-white dark:bg-slate-800"}
        />
        <Card 
          title="Oil Produced" 
          value={stats.today.oil} 
          unit="Kg" 
          subtext={`Consumption: ${stats.today.consumed}kg`}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Yield Trend (Last 7 Entries)</h3>
        <div className="h-48 w-full text-xs text-slate-600 dark:text-slate-400">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid stroke="currentColor" strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[30, 45]} hide />
              <Tooltip 
                cursor={{ stroke: 'currentColor', strokeWidth: 1, opacity: 0.5 }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem' 
                }}
                wrapperClassName="dark:[&_.recharts-tooltip-wrapper]:!bg-slate-800/80 dark:[&_.recharts-tooltip-wrapper]:!border-slate-600"
              />
              <ReferenceLine y={THRESHOLDS.MIN_OIL_YIELD} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: 'Min 38%', fill: 'red', fontSize: 10 }} />
              <Area type="monotone" dataKey="yield" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Sales Pulse</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <Card 
          title="Today's Sales Value" 
          value={`₹${todaysSales.toLocaleString()}`}
          color="bg-green-50 dark:bg-green-900/50 border-green-100 dark:border-green-800"
          icon={Coins}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Sales Trend (Last 7 Days)</h3>
        <div className="h-48 w-full text-xs text-slate-600 dark:text-slate-400">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7DaysSales}>
              <CartesianGrid stroke="currentColor" strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem' 
                }}
                wrapperClassName="dark:[&_.recharts-tooltip-wrapper]:!bg-slate-800/80 dark:[&_.recharts-tooltip-wrapper]:!border-slate-600"
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
              />
              <Bar dataKey="Sales" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Package size={16} /> Recent Raw Material Arrivals
        </h3>
        <div className="space-y-3">
          {recentInward.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No inward entries yet.</p>
          ) : (
            recentInward.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{entry.supplier}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{entry.dateStr} {entry.timeStr}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{entry.weightKg.toLocaleString()} kg</p>
                  <p className="text-[10px] text-slate-400">{entry.vehicleNo}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};