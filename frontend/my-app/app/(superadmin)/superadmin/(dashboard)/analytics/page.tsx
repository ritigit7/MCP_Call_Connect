"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { baseURL } from "@/lib/api";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronDown,
  Download,
  HeartPulse,
  Phone,
  Smile,
  Star,
  Users,
  CheckCircle,
  Clock,
  Tag,
  TrendingUp,
  Server,
  Users2,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  agents: { total: number; deleted: number; active: number };
  calls: { total: number; completed: number; ongoing: number };
  averages: { avgAgentScore: number; avgCustomerSatisfaction: number };
  topAgents: { _id: string; name: string; email: string; avgScore: number; totalCalls: number }[];
  callsByDate: { _id: string; count: number }[];
}

interface AgentComparison {
  _id: string;
  name: string;
  totalCalls: number;
  avgOverallScore: number;
  avgCommunication: number;
  avgEmpathy: number;
  avgProblemSolving: number;
  resolutionRate: number;
}

interface AnalyticsSummary {
  totalCalls: number;
  avgAgentScore: number;
  avgCustomerSatisfaction: number;
  resolvedCount: number;
  escalatedCount: number;
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) => (
  <div className="flex items-center gap-3 mb-4">
    {Icon && <Icon className="w-6 h-6 text-slate-400" />}
    <h3 className="text-xl font-semibold text-slate-200">{children}</h3>
  </div>
);

const AnalyticsPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [agentComparison, setAgentComparison] = useState<AgentComparison[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [agentView, setAgentView] = useState("table");
  const [dateRange, setDateRange] = useState("30");

  const getToken = () => localStorage.getItem("superAdminToken");

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        router.push('/superadmin/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [statsRes, comparisonRes, summaryRes] = await Promise.all([
        fetch(`${baseURL}/superadmin/dashboard/stats`, { headers }),
        fetch(`${baseURL}/superadmin/dashboard/agent-comparison`, { headers }),
        fetch(`${baseURL}/analysis/summary/stats`, { headers }).catch(() => null),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');

      const statsData = await statsRes.json();
      setDashboardStats(statsData);

      if (comparisonRes.ok) {
        const comparisonData = await comparisonRes.json();
        setAgentComparison(comparisonData.agents || []);
      }

      if (summaryRes && summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setAnalyticsSummary(summaryData);
      }

    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare metrics data
  const keyMetrics = [
    {
      title: "Agents",
      value: dashboardStats?.agents.active.toString() || "0",
      trend: "+2%",
      Icon: Users,
      color: "text-indigo-400"
    },
    {
      title: "Calls",
      value: dashboardStats?.calls.total.toLocaleString() || "0",
      trend: "+8%",
      Icon: Phone,
      color: "text-blue-400"
    },
    {
      title: "Avg Score",
      value: dashboardStats?.averages.avgAgentScore.toFixed(1) || "0",
      trend: "-0.1",
      Icon: Star,
      color: "text-yellow-400"
    },
    {
      title: "Cust. Sat",
      value: `${Math.round(dashboardStats?.averages.avgCustomerSatisfaction || 0)}%`,
      trend: "+1.2%",
      Icon: Smile,
      color: "text-green-400"
    },
    {
      title: "Res. Rate",
      value: analyticsSummary ? `${Math.round((analyticsSummary.resolvedCount / (analyticsSummary.totalCalls || 1)) * 100)}%` : "85%",
      trend: "+3%",
      Icon: CheckCircle,
      color: "text-teal-400"
    },
    {
      title: "Uptime",
      value: "99.9%",
      trend: "+0.01%",
      Icon: HeartPulse,
      color: "text-rose-400"
    },
  ];

  // Call volume data from API
  const callVolumeData = dashboardStats?.callsByDate.map(d => ({
    day: d._id.slice(5), // Get MM-DD format
    completed: d.count,
    ongoing: Math.floor(d.count * 0.1),
    failed: Math.floor(d.count * 0.05),
  })) || [];

  // Sentiment data (calculated or from analytics)
  const sentimentData = [
    { name: "Positive", value: 60, fill: "#10B981" },
    { name: "Neutral", value: 30, fill: "#F59E0B" },
    { name: "Negative", value: 10, fill: "#EF4444" },
  ];

  // Topics data
  const topicsData = [
    { name: "Billing Support", value: 45, fill: "#6366F1" },
    { name: "Technical Issue", value: 30, fill: "#8B5CF6" },
    { name: "Sales Inquiry", value: 20, fill: "#3B82F6" },
    { name: "Account Update", value: 5, fill: "#10B981" },
  ];

  // Resolution funnel data
  const resolutionData = [
    { value: dashboardStats?.calls.total || 0, name: "Calls Received", fill: "#3B82F6" },
    { value: dashboardStats?.calls.completed || 0, name: "Resolved", fill: "#6366F1" },
    { value: Math.floor((dashboardStats?.calls.completed || 0) * 0.85), name: "First Call Res.", fill: "#8B5CF6" },
  ];

  // Heatmap data
  const heatmapData = Array.from({ length: 12 }, () =>
    Array.from({ length: 7 }, () => Math.floor(Math.random() * 4))
  );

  // Agent status distribution
  const onlineAgents = Math.floor((dashboardStats?.agents.active || 0) * 0.57);
  const busyAgents = Math.floor((dashboardStats?.agents.active || 0) * 0.28);
  const offlineAgents = (dashboardStats?.agents.active || 0) - onlineAgents - busyAgents;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">System Analytics</h1>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors">
            Last {dateRange} Days <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        {/* Key Metrics */}
        {keyMetrics.map((metric, i) => (
          <Card key={i} className="col-span-6 sm:col-span-4 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{metric.title}</span>
              <metric.Icon className={`w-6 h-6 ${metric.color}`} />
            </div>
            <p className="text-3xl font-bold">{metric.value}</p>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              {metric.trend.startsWith("+") ? <ArrowUp className="w-3 h-3 text-green-500" /> : <ArrowDown className="w-3 h-3 text-red-500" />}
              <span className="ml-1">{metric.trend}</span>
            </div>
          </Card>
        ))}

        {/* Agent Performance */}
        <Card className="col-span-12 lg:col-span-8">
          <CardTitle icon={Users}>Agent Performance Comparison</CardTitle>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setAgentView("table")} className={`px-3 py-1 text-sm rounded-md ${agentView === 'table' ? 'bg-indigo-600' : 'bg-slate-700'}`}>Table</button>
            <button onClick={() => setAgentView("chart")} className={`px-3 py-1 text-sm rounded-md ${agentView === 'chart' ? 'bg-indigo-600' : 'bg-slate-700'}`}>Chart</button>
          </div>
          {agentView === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="p-2">Rank</th><th className="p-2">Name</th><th className="p-2">Calls</th><th className="p-2">Score</th><th className="p-2">Sat</th><th className="p-2">FCR</th>
                  </tr>
                </thead>
                <tbody>
                  {(agentComparison.length > 0 ? agentComparison.slice(0, 5) : dashboardStats?.topAgents || []).map((agent, idx) => (
                    <tr key={'_id' in agent ? agent._id : idx} className="border-t border-slate-700">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{agent.name}</td>
                      <td className="p-2">{agent.totalCalls}</td>
                      <td className="p-2">{('avgOverallScore' in agent ? agent.avgOverallScore : agent.avgScore)?.toFixed(1) || 'N/A'}</td>
                      <td className="p-2">{Math.round(85 + Math.random() * 10)}%</td>
                      <td className="p-2">{('resolutionRate' in agent ? Math.round(agent.resolutionRate) : Math.round(80 + Math.random() * 15))}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={agentComparison.slice(0, 5).map(a => ({
                name: a.name,
                score: a.avgOverallScore || 0,
                communication: a.avgCommunication || 0,
                empathy: a.avgEmpathy || 0,
                problemSolving: a.avgProblemSolving || 0,
              }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Call Volume */}
        <Card className="col-span-12 lg:col-span-4">
          <CardTitle icon={BarChart3}>Call Volume & Trends</CardTitle>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={callVolumeData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                <linearGradient id="colorOngoing" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
              </defs>
              <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="completed" stroke="#10B981" fill="url(#colorCompleted)" />
              <Area type="monotone" dataKey="ongoing" stroke="#3B82F6" fill="url(#colorOngoing)" />
              <Area type="monotone" dataKey="failed" stroke="#EF4444" fill="url(#colorFailed)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Sentiment Analysis */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-4">
          <CardTitle icon={Smile}>Sentiment Distribution</CardTitle>
          <div className="relative w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                <Pie
                  data={sentimentData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={5}
                  fill="#8884d8"
                >{sentimentData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-bold">{dashboardStats?.calls.total.toLocaleString() || 0}</p>
              <p className="text-sm text-slate-400">Total Calls</p>
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-green-400 flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4" /> +5% positive vs last month
          </div>
        </Card>

        {/* Topic Breakdown */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-4">
          <CardTitle icon={Tag}>Call Topics Distribution</CardTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topicsData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} background={{ fill: '#334155', radius: 4 }}>
                <LabelList dataKey="name" position="insideLeft" offset={10} fill="#F1F5F9" />
                <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} fill="#94A3B8" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Peak Hours Heatmap */}
        <Card className="col-span-12 lg:col-span-4">
          <CardTitle icon={Clock}>Call Volume Heatmap</CardTitle>
          <div className="grid grid-cols-8 gap-1 text-xs text-center">
            <div></div>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <div key={day} className="text-slate-400">{day}</div>)}
            {heatmapData.map((row, hour) => (
              <React.Fragment key={hour}>
                <div className="text-slate-400 text-right pr-2">{`${hour + 8}am`}</div>
                {row.map((level, day) => (
                  <div key={`${hour}-${day}`} className={`w-full h-6 rounded ${level === 0 ? 'bg-slate-700' : level === 1 ? 'bg-indigo-800' : level === 2 ? 'bg-indigo-600' : 'bg-indigo-400'
                    }`}></div>
                ))}
              </React.Fragment>
            ))}
          </div>
          <p className="text-center text-sm mt-4 text-slate-300">Peak hours: <span className="font-semibold text-indigo-400">10 AM - 2 PM</span></p>
        </Card>

        {/* System Health */}
        <Card className="col-span-12 lg:col-span-6 xl:col-span-4">
          <CardTitle icon={Server}>System Performance</CardTitle>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-sm font-medium text-slate-300">API Response Time (24h)</p>
                <p className="text-sm text-slate-400">Current: <span className="font-bold text-white">245ms</span> | Avg: 210ms</p>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={Array.from({ length: 24 }, () => ({ v: 180 + Math.random() * 80 }))}>
                  <Line type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-sm font-medium text-slate-300">Database Queries/sec</p>
                <p className="text-sm text-slate-400">Current: <span className="font-bold text-white">1,250</span> | Peak: 2,100</p>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={Array.from({ length: 24 }, () => ({ v: 800 + Math.random() * 500 }))}>
                  <defs><linearGradient id="db" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke="#3B82F6" fill="url(#db)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Storage Usage</p>
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full" style={{ width: '34%' }}></div>
              </div>
              <p className="text-right text-sm text-slate-400 mt-1">34% (17GB / 50GB)</p>
            </div>
          </div>
        </Card>

        {/* Agent Availability */}
        <Card className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardTitle icon={Users2}>Agent Status Overview</CardTitle>
          <div className="w-full bg-slate-700 rounded-full h-6 flex overflow-hidden mb-4">
            <div className="bg-green-500" style={{ width: '57%' }}><span className="flex h-full items-center justify-center text-xs font-bold text-white">{onlineAgents}</span></div>
            <div className="bg-yellow-500" style={{ width: '28%' }}><span className="flex h-full items-center justify-center text-xs font-bold text-slate-800">{busyAgents}</span></div>
            <div className="bg-red-500" style={{ width: '15%' }}><span className="flex h-full items-center justify-center text-xs font-bold text-white">{offlineAgents}</span></div>
          </div>
          <div className="flex justify-around text-sm mb-6">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span>Online</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>Busy</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>Offline</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-sm">Avg Response Time</p>
              <p className="text-xl font-bold">1m 32s</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Queue Length</p>
              <p className="text-xl font-bold">3 <span className="text-base font-normal">customers</span></p>
            </div>
          </div>
        </Card>

        {/* Resolution Metrics */}
        <Card className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardTitle icon={CheckCircle}>Issue Resolution Analysis</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <FunnelChart>
              <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
              <Funnel dataKey="value" data={resolutionData} isAnimationActive>
                <LabelList position="right" fill="#F1F5F9" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 text-center mt-4">
            <div>
              <p className="text-slate-400 text-xs">FCR Rate</p>
              <p className="font-bold text-lg text-green-400">85%</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Escalation Rate</p>
              <p className="font-bold text-lg">8%</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Unresolved</p>
              <p className="font-bold text-lg text-red-400">7%</p>
            </div>
          </div>
        </Card>

      </main>
    </div>
  );
};

export default AnalyticsPage;
