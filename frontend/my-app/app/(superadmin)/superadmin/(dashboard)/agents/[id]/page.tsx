"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { baseURL } from "@/lib/api";
import {
    ArrowLeft, Phone, Clock, Star, TrendingUp, TrendingDown,
    CheckCircle, XCircle, AlertTriangle, User, Mail, Calendar,
    Activity, BarChart2, MessageSquare, ThumbsUp, ThumbsDown,
    Loader2, RefreshCcw
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface AgentDetails {
    _id: string;
    name: string;
    email: string;
    status: string;
    isActive: boolean;
    createdAt: string;
    totalCalls: number;
    averageRating: number;
}

interface AgentStats {
    totalCalls: number;
    completedCalls: number;
    avgDuration: number;
    avgPerformanceScore: number;
    avgCustomerSatisfaction: number;
    sentimentBreakdown: {
        positive: number;
        neutral: number;
        negative: number;
    };
    issueResolution: {
        resolved: number;
        pending: number;
        escalated: number;
    };
}

interface RecentCall {
    _id: string;
    callId: string;
    startTime: string;
    duration: number;
    status: string;
    customer: {
        name: string;
        email: string;
    };
}

interface PerformanceStats {
    overall: number;
    communication: number;
    empathy: number;
    problemSolving: number;
    productKnowledge: number;
    professionalism: number;
}

const SENTIMENT_COLORS = ['#22c55e', '#facc15', '#ef4444'];
const RESOLUTION_COLORS = ['#22c55e', '#3b82f6', '#f97316'];

const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend?: number;
}) => (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 mt-1 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-6 h-6" style={{ color }} />
            </div>
        </div>
    </div>
);

const AgentDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<AgentDetails | null>(null);
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
    const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getToken = () => localStorage.getItem("superAdminToken");

    const fetchAgentDetails = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getToken();
            if (!token) {
                router.push('/superadmin/login');
                return;
            }

            const response = await fetch(`${baseURL}/superadmin/agents/${agentId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch agent details (${response.status})`);
            }

            const data = await response.json();

            setAgent(data.agent);
            setStats(data.stats);
            setRecentCalls(data.recentCalls || []);

            // Set performance stats from the response
            if (data.stats?.performanceScores) {
                setPerformanceStats(data.stats.performanceScores);
            } else {
                // Default performance data if not available
                setPerformanceStats({
                    overall: data.stats?.avgPerformanceScore || 0,
                    communication: 7.5,
                    empathy: 8.0,
                    problemSolving: 7.8,
                    productKnowledge: 8.2,
                    professionalism: 8.5
                });
            }
        } catch (err) {
            console.error("Error fetching agent details:", err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (agentId) {
            fetchAgentDetails();
        }
    }, [agentId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 text-xl mb-4">{error || 'Agent not found'}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const sentimentData = stats ? [
        { name: 'Positive', value: stats.sentimentBreakdown?.positive || 0 },
        { name: 'Neutral', value: stats.sentimentBreakdown?.neutral || 0 },
        { name: 'Negative', value: stats.sentimentBreakdown?.negative || 0 },
    ] : [];

    const resolutionData = stats ? [
        { name: 'Resolved', value: stats.issueResolution?.resolved || 0 },
        { name: 'Pending', value: stats.issueResolution?.pending || 0 },
        { name: 'Escalated', value: stats.issueResolution?.escalated || 0 },
    ] : [];

    const radarData = performanceStats ? [
        { subject: 'Communication', A: performanceStats.communication, fullMark: 10 },
        { subject: 'Empathy', A: performanceStats.empathy, fullMark: 10 },
        { subject: 'Problem Solving', A: performanceStats.problemSolving, fullMark: 10 },
        { subject: 'Product Knowledge', A: performanceStats.productKnowledge, fullMark: 10 },
        { subject: 'Professionalism', A: performanceStats.professionalism, fullMark: 10 },
    ] : [];

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold">Agent Details</h1>
                        <p className="text-gray-400 mt-1">Detailed performance and statistics</p>
                    </div>
                </div>
                <button
                    onClick={fetchAgentDetails}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Agent Profile Card */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
                        {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold">{agent.name}</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${agent.isActive
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}>
                                {agent.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${agent.status === 'online' ? 'bg-green-500/20 text-green-400' :
                                agent.status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-gray-500/20 text-gray-400'
                                }`}>
                                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                            </span>
                        </div>
                        <div className="flex items-center gap-6 mt-4 text-gray-400">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {agent.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Joined {new Date(agent.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                {agent.averageRating?.toFixed(1) || 'N/A'} Rating
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Calls"
                    value={stats?.totalCalls || 0}
                    icon={Phone}
                    color="#3b82f6"
                />
                <StatCard
                    title="Completed Calls"
                    value={stats?.completedCalls || 0}
                    icon={CheckCircle}
                    color="#22c55e"
                />
                <StatCard
                    title="Avg Duration"
                    value={formatDuration(stats?.avgDuration || 0)}
                    icon={Clock}
                    color="#8b5cf6"
                />
                <StatCard
                    title="Performance Score"
                    value={`${(stats?.avgPerformanceScore || 0).toFixed(1)}/10`}
                    icon={Star}
                    color="#f59e0b"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Performance Radar */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-blue-400" />
                        Performance Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Sentiment Distribution */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-400" />
                        Sentiment Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={sentimentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {sentimentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                        {sentimentData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[index] }} />
                                {entry.name}: {entry.value}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Issue Resolution */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        Issue Resolution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={resolutionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {resolutionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={RESOLUTION_COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                        {resolutionData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RESOLUTION_COLORS[index] }} />
                                {entry.name}: {entry.value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Calls */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="w-5 h-5 text-blue-400" />
                        Recent Calls
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date & Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {recentCalls.length > 0 ? recentCalls.map((call) => (
                                <tr key={call._id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-white">
                                            {new Date(call.startTime).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {new Date(call.startTime).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{call.customer?.name || 'Unknown'}</div>
                                        <div className="text-sm text-gray-400">{call.customer?.email || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Clock className="w-4 h-4" />
                                            {formatDuration(call.duration || 0)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${call.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                            call.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400' :
                                                call.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {call.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                                                call.status === 'failed' ? <XCircle className="w-3 h-3" /> :
                                                    <Activity className="w-3 h-3" />}
                                            {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No recent calls found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AgentDetailPage;
