"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Donut,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Rectangle,
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
  Database,
  Wifi,
  HardDrive,
  UserCheck,
  UserX,
  Users2,
  PhoneForwarded,
  PhoneOff,
  PhoneIncoming,
} from "lucide-react";
import { useState } from "react";

const mockData = {
  keyMetrics: [
    { title: "Agents", value: "150", trend: "+2%", Icon: Users, color: "text-indigo-400" },
    { title: "Calls", value: "5,420", trend: "+8%", Icon: Phone, color: "text-blue-400" },
    { title: "Avg Score", value: "8.2", trend: "-0.1", Icon: Star, color: "text-yellow-400" },
    { title: "Cust. Sat", value: "87%", trend: "+1.2%", Icon: Smile, color: "text-green-400" },
    { title: "Res. Rate", value: "85%", trend: "+3%", Icon: CheckCircle, color: "text-teal-400" },
    { title: "Uptime", value: "99.9%", trend: "+0.01%", Icon: HeartPulse, color: "text-rose-400" },
  ],
  agentPerformance: [
    { rank: 1, name: "Sarah S.", calls: 52, score: 9.2, sat: "92%", fcr: "95%" },
    { rank: 2, name: "John D.", calls: 48, score: 9.0, sat: "90%", fcr: "92%" },
    { rank: 3, name: "Mike W.", calls: 45, score: 8.9, sat: "88%", fcr: "90%" },
    { rank: 4, name: "Emily B.", calls: 44, score: 8.8, sat: "89%", fcr: "88%" },
    { rank: 5, name: "David L.", calls: 42, score: 8.7, sat: "85%", fcr: "87%" },
  ],
  callVolume: Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    completed: 100 + Math.random() * 80,
    ongoing: 20 + Math.random() * 20,
    failed: 5 + Math.random() * 10,
  })),
  sentiment: [
    { name: "Positive", value: 60, fill: "#10B981" },
    { name: "Neutral", value: 30, fill: "#F59E0B" },
    { name: "Negative", value: 10, fill: "#EF4444" },
  ],
  topics: [
    { name: "Billing Support", value: 45, fill: "#6366F1" },
    { name: "Technical Issue", value: 30, fill: "#8B5CF6" },
    { name: "Sales Inquiry", value: 20, fill: "#3B82F6" },
    { name: "Account Update", value: 5, fill: "#10B981" },
  ],
  heatmap: Array.from({ length: 12 }, (_, hour) =>
    Array.from({ length: 7 }, (_, day) => Math.floor(Math.random() * 4))
  ),
  resolution: [
    { value: 5420, name: "Calls Received", fill: "#3B82F6" },
    { value: 4607, name: "Resolved", fill: "#6366F1" },
    { value: 3907, name: "First Call Res.", fill: "#8B5CF6" },
  ],
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-4">
    {Icon && <Icon className="w-6 h-6 text-slate-400" />}
    <h3 className="text-xl font-semibold text-slate-200">{children}</h3>
  </div>
);

const AnalyticsPage = () => {
  const [agentView, setAgentView] = useState("table");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">System Analytics</h1>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors">
            Last 30 Days <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        {/* Key Metrics */}
        {mockData.keyMetrics.map((metric, i) => (
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
                  {mockData.agentPerformance.map(agent => (
                    <tr key={agent.rank} className="border-t border-slate-700">
                      <td className="p-2">{agent.rank}</td><td className="p-2">{agent.name}</td><td className="p-2">{agent.calls}</td><td className="p-2">{agent.score}</td><td className="p-2">{agent.sat}</td><td className="p-2">{agent.fcr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockData.agentPerformance}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                <Radar name="Sarah S." dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Call Volume */}
        <Card className="col-span-12 lg:col-span-4">
          <CardTitle icon={BarChart3}>Call Volume & Trends</CardTitle>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockData.callVolume}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorOngoing" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
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
              <Donut
                data={mockData.sentiment}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="80%"
              />
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-bold">5,420</p>
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
            <BarChart data={mockData.topics} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} background={{ fill: '#334155', radius: 4 }}>
                <LabelList dataKey="name" position="insideLeft" offset={10} fill="#F1F5F9" />
                <LabelList dataKey="value" position="right" formatter={(value) => `${value}%`} fill="#94A3B8" />
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
            {mockData.heatmap.map((row, hour) => (
              <>
                <div className="text-slate-400 text-right pr-2">{`${hour + 8}am`}</div>
                {row.map((level, day) => (
                  <div key={`${hour}-${day}`} className={`w-full h-6 rounded ${
                    level === 0 ? 'bg-slate-700' : level === 1 ? 'bg-indigo-800' : level === 2 ? 'bg-indigo-600' : 'bg-indigo-400'
                  }`}></div>
                ))}
              </>
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
                   <defs><linearGradient id="db" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
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
            <div className="bg-green-500" style={{ width: '57%' }}><span className="flex h-full items-center justify-center text-xs font-bold text-white">85</span></div>
            <div className="bg-yellow-500" style={{ width: '28%' }}><span className="flex h-full items-center justify-center text-xs font-bold text-slate-800">42</span></div>
            <div className="bg-red-500" style={{ width: '15%' }}><span className="flex h-full items-center justify-center text-xs font-bold text-white">23</span></div>
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
              <Funnel dataKey="value" data={mockData.resolution} isAnimationActive>
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