"use client";

import React from "react";
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
} from "lucide-react";

import Image from "next/image";

const StatCard = ({ title, value, trend, icon: Icon, color, trendColor }) => (
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

const HealthMetric = ({ title, value, percentage, status, icon: Icon }) => (
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

const TopPerformerRow = ({ rank, name, calls, score }) => {
  const rankColors = {
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
          <Image src="/avatars/02.png" alt="Customer" width={80} height={80} className="h-20 w-20 rounded-full border-4 border-gray-200" />
          {name}
        </div>
      </td>
      <td className="p-4 text-gray-300">{calls}</td>
      <td className="p-4 font-bold text-white">
        <span className="flex items-center gap-1">
          <Star size={16} className="text-yellow-400" /> {score.toFixed(1)}
        </span>
      </td>
    </tr>
  );
};

const ActivityItem = ({ icon: Icon, color, title, description, time }) => (
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

const QuickActionButton = ({ icon: Icon, label, color }) => (
  <button className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 bg-[#1E293B] rounded-lg border border-gray-700/50 hover:bg-${color}-500/10 hover:text-${color}-400 hover:border-${color}-500/50 transition-all duration-200`}>
    <Icon size={24} />
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

const SuperAdminDashboardPage = () => {
  const topPerformers = [
    { rank: 1, name: "Sarah Smith", calls: 52, score: 9.2 },
    { rank: 2, name: "John Doe", calls: 48, score: 9.0 },
    { rank: 3, name: "Mike Wilson", calls: 45, score: 8.9 },
    { rank: 4, name: "Lisa Brown", calls: 43, score: 8.7 },
    { rank: 5, name: "Tom Davis", calls: 41, score: 8.5 },
  ];

  return (
    <div className="space-y-6">
      {/* Alert Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/30 to-red-500/30 border border-orange-400/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <AlertTriangle className="text-orange-300" size={24} />
          <div>
            <p className="font-bold text-white">
              3 agents require attention
            </p>
            <p className="text-sm text-red-300">1 critical system alert</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm font-semibold text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
          View Details <ChevronRight size={16} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Agents"
          value="150"
          trend="+5"
          icon={Users}
          color="#3b82f6"
          trendColor="green"
        />
        <StatCard
          title="Total Calls Today"
          value="5,420"
          trend="+234"
          icon={Activity}
          color="#8b5cf6"
          trendColor="green"
        />
        <StatCard
          title="Average Score"
          value="8.2"
          trend="+0.3"
          icon={Star}
          color="#10b981"
          trendColor="green"
        />
        <StatCard
          title="Satisfaction Rate"
          value="87%"
          trend="-2%"
          icon={CheckCircle}
          color="#ef4444"
          trendColor="red"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3 lg:col-span-2 space-y-6">
          {/* Calls Activity Chart */}
          <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">
              📈 Call Volume (Last 30 Days)
            </h2>
            <div className="h-72 bg-black/20 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">[Area Chart Placeholder]</p>
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
                {topPerformers.map((performer) => (
                  <TopPerformerRow key={performer.rank} {...performer} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-3 lg:col-span-1 space-y-6">
          {/* System Health */}
          <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-6">
              🏥 System Health
            </h2>
            <div className="space-y-6">
              <HealthMetric
                title="API Response Time"
                value="245ms"
                percentage={75}
                status="Normal"
                icon={Server}
              />
              <HealthMetric
                title="Database Performance"
                value="98%"
                percentage={98}
                status="Excellent"
                icon={Database}
              />
              <HealthMetric
                title="WebSocket Connections"
                value="47/50"
                percentage={94}
                status="Stable"
                icon={Wifi}
              />
              <HealthMetric
                title="Storage Usage"
                value="34%"
                percentage={34}
                status="Healthy"
                icon={HardDrive}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-6">
              📋 Recent System Activity
            </h2>
            <div className="space-y-6">
              <ActivityItem
                icon={PlusCircle}
                color="green"
                title="New agent registered"
                description="Sarah Connor"
                time="5 minutes ago"
              />
              <ActivityItem
                icon={Settings2}
                color="blue"
                title="System updated"
                description="Version 2.1.0 deployed"
                time="1 hour ago"
              />
              <ActivityItem
                icon={Users}
                color="yellow"
                title="Agent deactivated"
                description="John Smith"
                time="2 hours ago"
              />
              <ActivityItem
                icon={XCircle}
                color="red"
                title="High churn risk detected"
                description="Customer #1234"
                time="3 hours ago"
              />
            </div>
            <button className="w-full mt-6 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              View All Activity →
            </button>
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