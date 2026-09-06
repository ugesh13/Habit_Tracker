'use client';

import type { CheckIn, Habit } from '@/lib/types/database';
import { eachDayOfInterval, format, subDays, getDay } from 'date-fns';
import { useState } from 'react';
import {
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import clsx from 'clsx';

interface InsightsChartsProps {
  habits: { id: string; title: string; checkIns: CheckIn[]; habitData: Habit }[];
}

const TIME_FILTERS = ['Weekly', 'Monthly', 'Yearly'];
const PIE_COLORS = ['#5d8065', '#8B7FA8', '#C97B5C', '#d4c790'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function InsightsCharts({ habits }: InsightsChartsProps) {
  const [filter, setFilter] = useState('Monthly');

  // 1. Line/Area Chart Data (Performance)
  const daysToLookBack = filter === 'Weekly' ? 7 : filter === 'Monthly' ? 30 : 365;
  const days = eachDayOfInterval({ start: subDays(new Date(), daysToLookBack - 1), end: new Date() });

  const trendData = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const completedCount = habits.filter((h) =>
      h.checkIns.some((c) => c.entry_date === dateStr && (c.status === 'complete' || c.status === 'streak_saved'))
    ).length;
    return { date: format(day, filter === 'Yearly' ? 'MMM' : 'MMM d'), completed: completedCount };
  });

  // 2. Pie Chart Data (Category Distribution)
  // Since habits don't have strict explicit categories yet, we use goal_type or time_block
  const pieMap: Record<string, number> = {};
  habits.forEach(h => {
    const cat = h.habitData?.time_block || 'anytime';
    pieMap[cat] = (pieMap[cat] || 0) + 1;
  });
  const pieData = Object.keys(pieMap).map(k => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: pieMap[k] }));

  // 3. Bar Chart Data (Rhythm / Day of Week completion)
  const rhythmMap = [0, 0, 0, 0, 0, 0, 0]; // Sun - Sat
  habits.forEach(h => {
    h.checkIns.forEach(c => {
      if (c.status === 'complete' || c.status === 'streak_saved') {
        const dayIndex = getDay(new Date(c.entry_date));
        rhythmMap[dayIndex]++;
      }
    });
  });
  const rhythmData = WEEKDAYS.map((day, i) => ({ day, completions: rhythmMap[i] }));

  return (
    <div className="space-y-8">
      {/* Time Filters */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-full bg-ink/[0.04] p-1 dark:bg-white/[0.04]">
          {TIME_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={clsx(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                filter === t ? 'bg-white text-sage-dark shadow-sm dark:bg-sage dark:text-paper' : 'text-ink/60 hover:text-ink dark:text-dark-text/60'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Area Chart */}
        <div className="rounded-card border border-hairline p-5 dark:border-dark-hairline bg-white/70 dark:bg-dark-surface/70 shadow-sm col-span-1 md:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-ink/80 dark:text-dark-text/80">Habit Performance ({filter})</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5d8065" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5d8065" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-hairline dark:stroke-dark-hairline" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="completed" stroke="#5d8065" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-card border border-hairline p-5 dark:border-dark-hairline bg-white/70 dark:bg-dark-surface/70 shadow-sm flex flex-col items-center">
          <h2 className="mb-2 text-sm font-medium text-ink/80 dark:text-dark-text/80 w-full text-left">Category Breakdown</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-ink/50 mt-10">No habits added yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Rhythm Bar Chart */}
        <div className="rounded-card border border-hairline p-5 dark:border-dark-hairline bg-white/70 dark:bg-dark-surface/70 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-ink/80 dark:text-dark-text/80">Your Rhythm (Completions by Day)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rhythmData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-hairline dark:stroke-dark-hairline" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(93, 128, 101, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="completions" fill="#5d8065" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
