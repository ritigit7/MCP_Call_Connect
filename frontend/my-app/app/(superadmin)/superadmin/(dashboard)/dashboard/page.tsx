"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Activity,
  Star,
  CheckCircle,
  Server,
  Database,
  Wifi,
  HardDrive,
  PlusCircle,
  Settings2,
  XCircle,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  FileText,
  Send,
  User,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { baseURL } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Types for API response
interface DashboardStats {
  agents: {
    total: number;
    deleted: number;
    active: number;
  };
  calls: {
    total: number;
    completed: number;
    ongoing: number;
  };
  averages: {
    avgAgentScore: number;
    avgCustomerSatisfaction: number;
  };
  topAgents: {
    _id: string;
    name: string;
    email: string;
    avgScore: number;
    totalCalls: number;
  }[];
  callsByDate: {
    _id: string;
    count: number;
  }[];
}

const StatCard = ({ title, value, trend, icon: Icon, color, trendColor }: any) => (
  <div
    className="bg-[#1E293B] rounded-xl p-6 relative overflow-hidden border border-gray-700/50"
    style={{ borderTop: `3px solid ${color}` }}
  >
    <div
      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center`}
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon size={20} style={{ color }} />
    </div>
    <p className="text-gray-400 text-sm font-medium">{title}</p>
    <p className="text-white text-4xl font-bold mt-2">{value}</p>
    <div className="flex items-center gap-2 mt-2">
      <span
        className={`flex items-center text-sm font-semibold ${trendColor === "green" ? "text-green-400" : "text-red-400"
          }`}
      >
        {trendColor === "green" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {trend}
      </span>
      <span className="text-gray-500 text-xs">vs last month</span>
    </div>
    {/* Placeholder for sparkline */}
    <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#1E293B] to-transparent"></div>
  </div>
);

const HealthMetric = ({ title, value, percentage, status, icon: Icon }: any) => (
  <div className="flex items-center gap-4">
    <Icon className="w-6 h-6 text-gray-400" />
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <p className="text-gray-300 font-medium">{title}</p>
        <span className="text-sm text-gray-400">{value}</span>
      </div>
      <div className="w-full bg-gray-600/50 rounded-full h-2.5">
        <div
          className="bg-green-500 h-2.5 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
    <span
      className={`text-sm font-semibold flex items-center gap-1 ${status === "Normal" || status === "Excellent" || status === "Stable" || status === "Healthy"
        ? "text-green-400"
        : "text-orange-400"
        }`}
    >
      <CheckCircle size={14} /> {status}
    </span>
  </div>
);

const TopPerformerRow = ({ rank, name, calls, score }: any) => {
  const rankColors: any = {
    1: "border-yellow-400 text-yellow-400",
    2: "border-gray-400 text-gray-400",
    3: "border-orange-400 text-orange-400",
  };
  const rankClass = rankColors[rank] || "border-gray-600 text-gray-500";

  return (
    <tr className="hover:bg-gray-800/50 transition-colors duration-200">
      <td className="p-4 font-bold">
        <span
          className={`w-6 h-6 flex items-center justify-center text-sm border-2 rounded-full ${rankClass}`}
        >
          {rank}
        </span>
      </td>
      <td className="p-4 font-semibold text-white">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-gray-600" />
          {name}
        </div>
      </td>
      <td className="p-4 text-gray-300">{calls}</td>
      <td className="p-4 font-bold text-white">
        <span className="flex items-center gap-1">
          <Star size={16} className="text-yellow-400" /> {score?.toFixed(1) || "N/A"}
        </span>
      </td>
    </tr>
  );
};

const ActivityItem = ({ icon: Icon, color, title, description, time }: any) => (
  <div className="flex gap-4">
    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-${color}-500/10`}>
      <Icon size={20} className={`text-${color}-400`} />
    </div>
    <div>
      <p className="font-semibold text-gray-200">{title}</p>
      <p className="text-sm text-gray-400">{description}</p>
      <p className="text-xs text-gray-500 mt-1">{time}</p>
    </div>
  </div>
);

const QuickActionButton = ({ icon: Icon, label, color }: any) => (
  <button className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 bg-[#1E293B] rounded-lg border border-gray-700/50 hover:bg-${color}-500/10 hover:text-${color}-400 hover:border-${color}-500/50 transition-all duration-200`}>
    <Icon size={24} />
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

const SuperAdminDashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("superAdminToken");
        if (!token) {
          router.push("/superadmin/login");
          return;
        }

        const response = await fetch(`${baseURL}/superadmin/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard statistics");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate today calls from callsByDate
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCallsHelper = stats?.callsByDate.find(d => d._id === todayStr);
  const todayCalls = todayCallsHelper ? todayCallsHelper.count : 0;

  // Prepare chart data
  const chartData = stats?.callsByDate.map(d => ({
    date: d._id,
    calls: d.count
  })) || [];

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Agents"
          value={stats?.agents.active.toString() || "0"}
          trend="+5" // This would ideally properly calculated if historic data was available
          icon={Users}
          color="#3b82f6"
          trendColor="green"
        />
        <StatCard
          title="Total Calls Today"
          value={todayCalls.toLocaleString()}
          trend="+12%"
          icon={Activity}
          color="#8b5cf6"
          trendColor="green"
        />
        <StatCard
          title="Average Score"
          value={stats?.averages.avgAgentScore.toFixed(1) || "0.0"}
          trend="+0.3"
          icon={Star}
          color="#10b981"
          trendColor="green"
        />
        <StatCard
          title="Satisfaction Rate"
          value={`${(stats?.averages.avgCustomerSatisfaction || 0).toFixed(0)}%`}
          trend="-2%"
          icon={CheckCircle}
          color="#ef4444"
          trendColor="red"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-3 lg:col-span-2 space-y-6">
          {/* Calls Activity Chart */}
          <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">
              📈 Call Volume (Last 30 Days)
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => value.slice(5)} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="calls" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCalls)" />
                </AreaChart>
              </ResponsiveContainer>
              {chartData.length === 0 && (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No chart data available
                </div>
              )}
            </div>
          </div>

          {/* Top Performers Table */}
          <div className="bg-[#1E293B] rounded-xl border border-gray-700/50 overflow-hidden">
            <h2 className="text-xl font-bold text-white p-6">
              🏆 Top 5 Performing Agents
            </h2>
            <table className="w-full text-left">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-400">Rank</th>
                  <th className="p-4 text-sm font-semibold text-gray-400">Name</th>
                  <th className="p-4 text-sm font-semibold text-gray-400">Calls</th>
                  <th className="p-4 text-sm font-semibold text-gray-400">Score</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topAgents.map((performer, index) => (
                  <TopPerformerRow
                    key={performer._id}
                    rank={index + 1}
                    name={performer.name}
                    calls={performer.totalCalls}
                    score={performer.avgScore}
                  />
                ))}
                {(!stats?.topAgents || stats.topAgents.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No top agents data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>


      </div>

      {/* Quick Actions */}
      <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h2>
        <div className="flex flex-wrap gap-4 text-gray-300">
          <QuickActionButton icon={PlusCircle} label="Create Agent" color="blue" />
          <QuickActionButton icon={FileText} label="Generate Report" color="purple" />
          <QuickActionButton icon={Send} label="Send Announcement" color="green" />
          <QuickActionButton icon={Settings2} label="System Settings" color="yellow" />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;