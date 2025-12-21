"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  Clock,
  Star,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { baseURL } from "@/lib/api";

type CallStatus = "Completed" | "Ongoing" | "Failed" | "Initiated" | "Missed" | "Voicemail";

interface Call {
  _id: string;
  customer: {
    name: string;
  };
  startTime: string;
  duration: number;
  status: CallStatus;
}

interface Stats {
  totalCalls: number;
  ongoingCalls: number;
  averageDuration: number;
}

const AgentDashboardPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('agent-token');
        if (!token) {
          throw new Error("No authentication token found. Please log in again.");
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
        };

        // Use Promise.all to fetch stats and calls in parallel
        const [statsRes, callsRes] = await Promise.all([
          fetch(`${baseURL}/calls/stats`, { headers }),
          fetch(`${baseURL}/calls/my-calls`, { headers })
        ]);

        if (!statsRes.ok || !callsRes.ok) {
          const statsError = !statsRes.ok ? await statsRes.json() : null;
          const callsError = !callsRes.ok ? await callsRes.json() : null;
          throw new Error(statsError?.error || callsError?.error || "Failed to fetch dashboard data.");
        }

        const statsData = await statsRes.json();
        const callsData = await callsRes.json();

        setStats(statsData);
        setRecentCalls(callsData.calls);

      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : (
        <>
          <StatsCards stats={stats} />
          <div className="mt-6">
            <RecentCallsTable calls={recentCalls} />
          </div>
        </>
      )}
    </>
  );
};

const DashboardSkeleton = () => (
  <>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[150px] animate-pulse rounded-xl bg-gray-200"></div>
      ))}
    </div>
    <div className="mt-6 h-[400px] animate-pulse rounded-xl bg-gray-200"></div>
  </>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-12 text-center">
    <AlertCircle className="h-12 w-12 text-red-500" />
    <h3 className="mt-4 text-xl font-semibold text-red-800">Failed to Load Data</h3>
    <p className="mt-2 text-red-600">An error occurred while fetching dashboard information.</p>
    <p className="mt-2 text-sm text-red-500 font-mono">{message}</p>
  </div>
);

const StatsCards = ({ stats }: { stats: Stats | null }) => {
  const score = 8.5;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 10) * circumference;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const cards = [
    {
      label: "Total Calls Today",
      value: stats?.totalCalls ?? 0,
      icon: Phone,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
    },
    {
      label: "Active Calls",
      value: stats?.ongoingCalls ?? 0,
      icon: Clock,
      iconBg: "bg-green-100",
      iconColor: "text-green-500",
      pulsing: true,
    },
    {
      label: "Avg. Duration",
      value: formatDuration(stats?.averageDuration ?? 0),
      icon: Clock,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-500",
      trend: "-3%",
      trendColor: "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className={`absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full ${card.iconBg} ${card.pulsing ? 'animate-pulse' : ''}`}>
            <card.icon size={24} className={card.iconColor} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{String(card.value)}</p>
          <p className="mt-1 text-sm text-gray-500">{card.label}</p>
          {card.trend && (
            <p className={`mt-4 text-xs font-medium ${card.trendColor}`}>
              {card.trend} from last week
            </p>
          )}
        </div>
      ))}
      {/* Your Score Card */}
      <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <Star size={24} className="text-yellow-500" />
        </div>
        <div className="relative h-20 w-20">
          <svg className="h-full w-full" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" strokeWidth="4" className="stroke-gray-200" fill="none" />
            <circle cx="20" cy="20" r="18" strokeWidth="4" className="stroke-yellow-400" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{score}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Your Score</p>
      </div>
    </div>
  );
};

const RecentCallsTable = ({ calls }: { calls: Call[] }) => {
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const StatusBadge = ({ status }: { status: CallStatus }) => {
    const styles = {
      Completed: "bg-green-100 text-green-800",
      Missed: "bg-red-100 text-red-800",
      Voicemail: "bg-yellow-100 text-yellow-800",
      Ongoing: "bg-blue-100 text-blue-800",
      Failed: "bg-red-100 text-red-800",
      Initiated: "bg-gray-100 text-gray-800",
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Recent Calls</h2>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {calls.slice(0, 5).map((call) => (
              <tr key={call._id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-medium text-gray-800">{call.customer.name}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatTime(call.startTime)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatDuration(call.duration)}</td>
                <td className="py-3 px-4"><StatusBadge status={call.status} /></td>
                <td className="py-3 px-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <p>Showing 1 to {Math.min(5, calls.length)} of {calls.length} results</p>
        <div className="flex items-center gap-2">
          <button className="rounded-md p-2 hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <button className="rounded-md p-2 hover:bg-gray-100"><ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboardPage;
