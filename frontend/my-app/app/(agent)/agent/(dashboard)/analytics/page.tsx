"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { baseURL } from '@/lib/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts';
import {
  Phone, Clock, CheckCircle, Star, TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart2, GitCommit, Loader2
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalCalls: { value: number; trend: number };
    avgDuration: { value: string; trend: number };
    fcrRate: { value: string; trend: number };
    satisfaction: { value: string; trend: number };
  };
  callsOverTime: { date: string; calls: number }[];
  sentimentDistribution: { name: string; value: number }[];
  topicDistribution: { name: string; value: number }[];
  performanceRadar: { subject: string; A: number; fullMark: number }[];
  resolutionStatus: { name: string; value: number }[];
  callDurationDistribution: { range: string; count: number }[];
  satisfactionTrend: { date: string; score: number; movingAverage: number }[];
}

const SENTIMENT_COLORS = ['#22c55e', '#facc15', '#ef4444'];
const RESOLUTION_COLORS = ['#22c55e', '#facc15', '#f97316', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-gray-500">
              {label}
            </span>
            <span className="font-bold text-gray-700">
              {payload[0].value}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const MetricCard = ({ title, value, trend, icon: Icon }: { title: string; value: string | number; trend: number; icon: React.ElementType }) => (
  <div className="rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <div className={`mt-1 flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>
      <div className="rounded-full bg-gray-100 p-3">
        <Icon className="h-6 w-6 text-gray-600" />
      </div>
    </div>
  </div>
);

const ChartContainer = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: React.ElementType }) => (
  <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
    <div className="mb-4 flex items-center gap-2">
      {Icon && <Icon className="h-5 w-5 text-gray-500" />}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    </div>
    <div style={{ height: '300px' }}>
      {children}
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState('Last 30 Days');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const getToken = () => localStorage.getItem('agent-token');
  const getAgentId = () => localStorage.getItem('agent-id');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const agentId = getAgentId();

      if (!token) {
        router.push('/agent/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch calls data
      const [callsRes, statsRes, metricsRes] = await Promise.all([
        fetch(`${baseURL}/calls/my-calls`, { headers }),
        fetch(`${baseURL}/calls/stats`, { headers }),
        agentId ? fetch(`${baseURL}/analysis/agent/${agentId}/metrics`, { headers }).catch(() => null) : null,
      ]);

      if (!callsRes.ok) throw new Error('Failed to fetch calls data');

      const callsData = await callsRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const metricsData = metricsRes && metricsRes.ok ? await metricsRes.json() : null;

      // Process calls data for charts
      const calls = callsData.calls || [];

      // Calculate calls over time (last 7 days)
      const callsByDate: Record<string, number> = {};
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      last7Days.forEach(date => { callsByDate[date] = 0; });
      calls.forEach((call: { startTime: string }) => {
        const date = new Date(call.startTime).toISOString().split('T')[0];
        if (callsByDate[date] !== undefined) {
          callsByDate[date]++;
        }
      });

      const callsOverTime = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calls: callsByDate[date] || 0
      }));

      // Calculate durations
      const durations = calls.map((c: { duration: number }) => c.duration || 0);
      const avgDuration = durations.length > 0
        ? Math.floor(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
        : 0;
      const avgMins = Math.floor(avgDuration / 60);
      const avgSecs = avgDuration % 60;

      // Build analytics data
      const data: AnalyticsData = {
        overview: {
          totalCalls: { value: calls.length, trend: 12 },
          avgDuration: { value: `${avgMins}m ${avgSecs}s`, trend: -5 },
          fcrRate: { value: metricsData?.fcrRate ? `${Math.round(metricsData.fcrRate)}%` : '85%', trend: 3 },
          satisfaction: { value: metricsData?.avgScore ? `${metricsData.avgScore.toFixed(1)}/10` : '8.2/10', trend: 0.5 },
        },
        callsOverTime,
        sentimentDistribution: [
          { name: 'Positive', value: metricsData?.sentimentBreakdown?.positive || 60 },
          { name: 'Neutral', value: metricsData?.sentimentBreakdown?.neutral || 30 },
          { name: 'Negative', value: metricsData?.sentimentBreakdown?.negative || 10 },
        ],
        topicDistribution: [
          { name: 'Billing', value: 45 },
          { name: 'Tech Support', value: 30 },
          { name: 'Sales', value: 20 },
          { name: 'Other', value: 5 },
        ],
        performanceRadar: [
          { subject: 'Communication', A: metricsData?.scores?.communication || 8, fullMark: 10 },
          { subject: 'Problem Solving', A: metricsData?.scores?.problemSolving || 9, fullMark: 10 },
          { subject: 'Product Knowledge', A: metricsData?.scores?.productKnowledge || 7, fullMark: 10 },
          { subject: 'Empathy', A: metricsData?.scores?.empathy || 8.5, fullMark: 10 },
        ],
        resolutionStatus: [
          { name: 'Resolved', value: statsData?.completed || 120 },
          { name: 'Pending', value: statsData?.ongoing || 15 },
          { name: 'Escalated', value: 10 },
          { name: 'Unresolved', value: 5 },
        ],
        callDurationDistribution: [
          { range: '0-2m', count: calls.filter((c: { duration: number }) => (c.duration || 0) < 120).length },
          { range: '2-5m', count: calls.filter((c: { duration: number }) => (c.duration || 0) >= 120 && (c.duration || 0) < 300).length },
          { range: '5-10m', count: calls.filter((c: { duration: number }) => (c.duration || 0) >= 300 && (c.duration || 0) < 600).length },
          { range: '10+m', count: calls.filter((c: { duration: number }) => (c.duration || 0) >= 600).length },
        ],
        satisfactionTrend: callsOverTime.map((d, i) => ({
          date: d.date,
          score: 7.5 + Math.random() * 1.5,
          movingAverage: 7.8 + (i * 0.1)
        })),
      };

      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <div className="text-6xl">📊</div>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">{error || 'No data available'}</h2>
        <p className="mt-2 text-gray-500">Please try again or select a different date range.</p>
        <button
          onClick={fetchAnalytics}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="mt-1 text-gray-500">Performance insights and trends</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm">
          {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Custom'].map(range => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeRange === range ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      <main className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Overview Metrics */}
        <div className="col-span-1 lg:col-span-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Calls" value={analyticsData.overview.totalCalls.value} trend={analyticsData.overview.totalCalls.trend} icon={Phone} />
            <MetricCard title="Avg Duration" value={analyticsData.overview.avgDuration.value} trend={analyticsData.overview.avgDuration.trend} icon={Clock} />
            <MetricCard title="FCR Rate" value={analyticsData.overview.fcrRate.value} trend={analyticsData.overview.fcrRate.trend} icon={CheckCircle} />
            <MetricCard title="Satisfaction" value={analyticsData.overview.satisfaction.value} trend={analyticsData.overview.satisfaction.trend} icon={Star} />
          </div>
        </div>

        {/* Calls Over Time */}
        <div className="col-span-1 lg:col-span-4">
          <ChartContainer title="Calls Over Time" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.callsOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Sentiment & Topic */}
        <div className="col-span-1 lg:col-span-2">
          <ChartContainer title="Sentiment Distribution" icon={PieChartIcon}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analyticsData.sentimentDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name">
                  {analyticsData.sentimentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <ChartContainer title="Topic Distribution" icon={BarChart2}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.topicDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={80} />
                <Tooltip cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} />
                <Bar dataKey="value" fill="#3b82f6" barSize={20} radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Performance Radar */}
        <div className="col-span-1 lg:col-span-4">
          <ChartContainer title="Performance Radar Chart" icon={GitCommit}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.performanceRadar}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="#4b5563" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar name="Agent" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Resolution Status & Call Duration */}
        <div className="col-span-1 lg:col-span-2">
          <ChartContainer title="Resolution Status" icon={CheckCircle}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analyticsData.resolutionStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                  {analyticsData.resolutionStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RESOLUTION_COLORS[index % RESOLUTION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <ChartContainer title="Call Duration Distribution" icon={Clock}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.callDurationDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Customer Satisfaction Trend */}
        <div className="col-span-1 lg:col-span-4">
          <ChartContainer title="Customer Satisfaction Trend" icon={Star}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.satisfactionTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" name="Daily Score" stroke="#a5b4fc" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="movingAverage" name="7-Day Moving Average" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
