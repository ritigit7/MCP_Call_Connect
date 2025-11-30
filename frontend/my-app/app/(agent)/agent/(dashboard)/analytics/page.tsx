"use client"

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, DonutChart
} from 'recharts';
import {
  Phone, Clock, CheckCircle, Star, TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart2, GitCommit, AlertTriangle, XCircle, FileText
} from 'lucide-react';

const mockData = {
  overview: {
    totalCalls: { value: 150, trend: 12 },
    avgDuration: { value: '4m 32s', trend: -5 },
    fcrRate: { value: '85%', trend: 3 },
    satisfaction: { value: '8.2/10', trend: 0.5 },
  },
  callsOverTime: [
    { date: 'Nov 22', calls: 20 }, { date: 'Nov 23', calls: 35 }, { date: 'Nov 24', calls: 45 },
    { date: 'Nov 25', calls: 30 }, { date: 'Nov 26', calls: 50 }, { date: 'Nov 27', calls: 65 },
    { date: 'Nov 28', calls: 55 },
  ],
  sentimentDistribution: [
    { name: 'Positive', value: 400 }, { name: 'Neutral', value: 300 }, { name: 'Negative', value: 150 },
  ],
  topicDistribution: [
    { name: 'Billing', value: 45 }, { name: 'Tech Support', value: 30 },
    { name: 'Sales', value: 20 }, { name: 'Other', value: 5 },
  ],
  performanceRadar: [
    { subject: 'Communication', A: 8, fullMark: 10 }, { subject: 'Problem Solving', A: 9, fullMark: 10 },
    { subject: 'Product Knowledge', A: 7, fullMark: 10 }, { subject: 'Empathy', A: 8.5, fullMark: 10 },
  ],
  resolutionStatus: [
    { name: 'Resolved', value: 120 }, { name: 'Pending', value: 15 },
    { name: 'Escalated', value: 10 }, { name: 'Unresolved', value: 5 },
  ],
  callDurationDistribution: [
    { range: '0-2m', count: 25 }, { range: '2-5m', count: 60 },
    { range: '5-10m', count: 40 }, { range: '10+m', count: 25 },
  ],
  satisfactionTrend: [
    { date: 'Nov 22', score: 7.5, movingAverage: 7.8 }, { date: 'Nov 23', score: 8.0, movingAverage: 7.9 },
    { date: 'Nov 24', score: 8.5, movingAverage: 8.1 }, { date: 'Nov 25', score: 7.8, movingAverage: 8.0 },
    { date: 'Nov 26', score: 8.2, movingAverage: 8.1 }, { date: 'Nov 27', score: 8.8, movingAverage: 8.3 },
    { date: 'Nov 28', score: 9.0, movingAverage: 8.5 },
  ],
};

const SENTIMENT_COLORS = ['#22c55e', '#facc15', '#ef4444'];
const RESOLUTION_COLORS = ['#22c55e', '#facc15', '#f97316', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold text-muted-foreground">
              {payload[0].value}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const MetricCard = ({ title, value, trend, icon: Icon }) => (
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

const ChartContainer = ({ title, children, icon: Icon }) => (
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
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('Last 30 Days');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1500); // Simulate data fetching
    return () => clearTimeout(timer);
  }, [activeRange]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (!mockData) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <div className="text-6xl">📊</div>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">No data available for selected period</h2>
        <p className="mt-2 text-gray-500">Please try a different date range to view analytics.</p>
        <button className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Try a different date range
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
            <MetricCard title="Total Calls" value={mockData.overview.totalCalls.value} trend={mockData.overview.totalCalls.trend} icon={Phone} />
            <MetricCard title="Avg Duration" value={mockData.overview.avgDuration.value} trend={mockData.overview.avgDuration.trend} icon={Clock} />
            <MetricCard title="FCR Rate" value={mockData.overview.fcrRate.value} trend={mockData.overview.fcrRate.trend} icon={CheckCircle} />
            <MetricCard title="Satisfaction" value={mockData.overview.satisfaction.value} trend={mockData.overview.satisfaction.trend} icon={Star} />
          </div>
        </div>

        {/* Calls Over Time */}
        <div className="col-span-1 lg:col-span-4">
          <ChartContainer title="Calls Over Time" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData.callsOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                <Pie data={mockData.sentimentDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name">
                  {mockData.sentimentDistribution.map((entry, index) => (
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
              <BarChart data={mockData.topicDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
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
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockData.performanceRadar}>
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
                <Pie data={mockData.resolutionStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                  {mockData.resolutionStatus.map((entry, index) => (
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
              <AreaChart data={mockData.callDurationDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
              <LineChart data={mockData.satisfactionTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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

const SkeletonCard = () => (
  <div className="rounded-xl bg-white p-5 shadow-sm">
    <div className="flex animate-pulse items-start justify-between">
      <div>
        <div className="mb-2 h-4 w-24 rounded bg-gray-200"></div>
        <div className="h-9 w-20 rounded bg-gray-200"></div>
        <div className="mt-2 h-4 w-16 rounded bg-gray-200"></div>
      </div>
      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
    </div>
  </div>
);

const SkeletonChart = () => (
  <div className="rounded-xl bg-white p-6 shadow-sm">
    <div className="animate-pulse">
      <div className="mb-4 h-6 w-48 rounded bg-gray-200"></div>
      <div className="h-[300px] rounded bg-gray-200"></div>
    </div>
  </div>
);

const AnalyticsSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
    <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <div className="h-9 w-72 rounded bg-gray-300"></div>
        <div className="mt-2 h-5 w-64 rounded bg-gray-200"></div>
      </div>
      <div className="h-10 w-96 rounded-lg bg-gray-200"></div>
    </header>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="col-span-1 lg:col-span-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
      <div className="col-span-1 lg:col-span-4">
        <SkeletonChart />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <SkeletonChart />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <SkeletonChart />
      </div>
      <div className="col-span-1 lg:col-span-4">
        <SkeletonChart />
      </div>
    </div>
  </div>
);

export default AnalyticsDashboard;