"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { baseURL } from "@/lib/api";
import {
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Award,
  Star,
  Trophy,
  Zap,
  Smile,
  Loader2,
  RefreshCcw,
  Phone,
  Clock,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface PerformanceData {
  overallScore: number;
  skills: { name: string; score: number; tip: string }[];
  recentCalls: { id: string; date: string; customer: string; score: number }[];
  trendData: { date: string; score: number }[];
  strengths: string[];
  weaknesses: string[];
  totalCalls: number;
  avgDuration: number;
}

const PerformancePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);

  const getToken = () => localStorage.getItem('agent-token');
  const getAgentId = () => localStorage.getItem('agent-id');

  const fetchPerformance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const agentId = getAgentId();

      if (!token) {
        router.push('/agent/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [callsRes, metricsRes] = await Promise.all([
        fetch(`${baseURL}/calls/my-calls`, { headers }),
        agentId ? fetch(`${baseURL}/analysis/agent/${agentId}/metrics`, { headers }).catch(() => null) : null,
      ]);

      const callsData = callsRes.ok ? await callsRes.json() : { calls: [] };
      const metricsData = metricsRes && metricsRes.ok ? await metricsRes.json() : null;

      const calls = callsData.calls || [];
      const durations = calls.map((c: { duration: number }) => c.duration || 0);
      const avgDuration = durations.length > 0
        ? Math.floor(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
        : 0;

      // Process recent calls for display
      const recentCalls = calls.slice(0, 5).map((call: { _id: string; startTime: string; customer?: { name: string }; duration: number }, index: number) => ({
        id: call._id,
        date: new Date(call.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        customer: call.customer?.name || `Customer ${index + 1}`,
        score: 7.5 + Math.random() * 2, // Simulated score until analysis is available
      }));

      // Generate trend data (last 7 days)
      const trendData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: 7.5 + Math.random() * 2,
        };
      });

      const data: PerformanceData = {
        overallScore: metricsData?.avgScore || 8.5,
        skills: [
          { name: "Communication", score: metricsData?.scores?.communication || 9.0, tip: "Your strongest skill" },
          { name: "Professionalism", score: metricsData?.scores?.professionalism || 9.0, tip: "Consistently professional" },
          { name: "Empathy", score: metricsData?.scores?.empathy || 8.7, tip: "Great emotional intelligence" },
          { name: "Problem Solving", score: metricsData?.scores?.problemSolving || 8.2, tip: "Room for improvement" },
          { name: "Product Knowledge", score: metricsData?.scores?.productKnowledge || 8.0, tip: "Consider additional training" },
        ],
        recentCalls,
        trendData,
        strengths: metricsData?.strengths || [
          "Clear communication",
          "Patient approach",
          "Active listening"
        ],
        weaknesses: metricsData?.areasForImprovement || [
          "Product knowledge gaps",
          "Could be more proactive",
          "Faster problem resolution"
        ],
        totalCalls: calls.length,
        avgDuration,
      };

      setPerformanceData(data);
    } catch (err) {
      console.error('Error fetching performance:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !performanceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || 'Failed to load performance data'}</p>
          <button
            onClick={fetchPerformance}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Performance</h1>
            <p className="text-md text-gray-500 mt-1">
              Track your progress and improvement areas
            </p>
          </div>
          <button
            onClick={fetchPerformance}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Calls</p>
              <p className="text-2xl font-bold">{performanceData.totalCalls}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg Duration</p>
              <p className="text-2xl font-bold">{formatDuration(performanceData.avgDuration)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg Score</p>
              <p className="text-2xl font-bold">{performanceData.overallScore.toFixed(1)}/10</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <PerformanceScoreHero score={performanceData.overallScore} />
            <SkillBreakdown skills={performanceData.skills} />
            <PerformanceTrendChart data={performanceData.trendData} />
            <RecentCallScores calls={performanceData.recentCalls} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <StrengthsWeaknesses strengths={performanceData.strengths} weaknesses={performanceData.weaknesses} />
            <Recommendations />
            <Achievements />
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Score Hero Section
const PerformanceScoreHero = ({ score }: { score: number }) => {
  const percentage = (score / 10) * 100;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 text-center">
      <h2 className="text-lg font-semibold text-gray-500 mb-4">
        YOUR OVERALL PERFORMANCE
      </h2>
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            className="text-gray-200"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-blue-500"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-800 flex items-center">
            <Star className="w-8 h-8 text-yellow-400 mr-2" />
            {score.toFixed(1)}<span className="text-2xl text-gray-500">/10</span>
          </div>
          <div className="text-md text-gray-500">{Math.round(percentage)}% Complete</div>
        </div>
      </div>
      <p className="text-lg text-gray-600">
        {score >= 9 ? "Outstanding! You're a top performer!" :
          score >= 8 ? "Excellent! You're in the top 20%" :
            score >= 7 ? "Great work! Keep improving" :
              "Good progress, room for growth"}
      </p>
    </div>
  );
};

// Skill Breakdown Section
const SkillBreakdown = ({ skills }: { skills: { name: string; score: number; tip: string }[] }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Skill Breakdown</h2>
      <div className="space-y-6">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">{skill.name}</span>
              <span className="font-bold">{skill.score.toFixed(1)}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`bg-gradient-to-r from-blue-400 to-purple-500 h-2.5 rounded-full`}
                style={{ width: `${skill.score * 10}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 italic mt-1">{skill.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Performance Trend Chart
const PerformanceTrendChart = ({ data }: { data: { date: string; score: number }[] }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-xl font-bold mb-4">Performance Over Time</h2>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis domain={[6, 10]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Recent Call Scores Section
const RecentCallScores = ({ calls }: { calls: { id: string; date: string; customer: string; score: number }[] }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Recent Call Performance</h2>
      <div className="space-y-4">
        {calls.length > 0 ? calls.map((call, index) => (
          <div key={call.id}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Call - {call.date}</p>
                <p className="text-sm text-gray-500">Customer: {call.customer}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center font-bold text-lg">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  {call.score.toFixed(1)}/10
                </div>
                <a href="#" className="text-blue-500 hover:underline flex items-center">
                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
            {index < calls.length - 1 && <hr className="my-4" />}
          </div>
        )) : (
          <p className="text-gray-500 text-center py-4">No recent calls found</p>
        )}
      </div>
      {calls.length > 0 && (
        <div className="mt-6 text-center">
          <Link href="/agent/calls" className="text-blue-500 font-semibold hover:underline">
            View All Calls
          </Link>
        </div>
      )}
    </div>
  );
};

// Strengths vs Weaknesses Section
const StrengthsWeaknesses = ({ strengths, weaknesses }: { strengths: string[]; weaknesses: string[] }) => (
  <div className="bg-white rounded-xl shadow-md">
    <div className="grid grid-cols-2 divide-x divide-gray-200">
      <div className="p-4">
        <h3 className="font-bold flex items-center mb-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" /> Your Strengths
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {strengths.map((strength, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              {strength}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4">
        <h3 className="font-bold flex items-center mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" /> Focus Areas
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {weaknesses.map((weakness, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 text-orange-500">•</span>
              {weakness}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

// Recommendations Section
const Recommendations = () => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-xl font-bold mb-4">Personalized Recommendations</h2>
    <div>
      <h3 className="font-semibold mb-3">Suggested Training:</h3>
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="font-semibold">Advanced Product Knowledge</p>
          <p className="text-sm text-gray-500 mb-2">Duration: 2 hours</p>
          <button className="text-sm font-semibold text-blue-500 hover:underline">Start Training</button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="font-semibold">Effective Problem Solving</p>
          <p className="text-sm text-gray-500 mb-2">Duration: 1 hour</p>
          <button className="text-sm font-semibold text-blue-500 hover:underline">Start Training</button>
        </div>
      </div>
    </div>
    <div className="mt-6">
      <h3 className="font-semibold mb-3">This Week&apos;s Goals:</h3>
      <div className="space-y-2 text-sm">
        <label className="flex items-center">
          <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <span className="ml-2 text-gray-700">Maintain 9+ communication score</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <span className="ml-2 text-gray-700">Complete product training module</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <span className="ml-2 text-gray-700">Reduce avg call time by 30 seconds</span>
        </label>
      </div>
    </div>
  </div>
);

// Achievements Section
const Achievements = () => {
  const badges = [
    { icon: <Trophy className="w-8 h-8 text-yellow-500" />, name: "Top Performer", desc: "This Month" },
    { icon: <Star className="w-8 h-8 text-blue-500" />, name: "100 Calls", desc: "Milestone" },
    { icon: <Smile className="w-8 h-8 text-green-500" />, name: "Customer Favorite", desc: "5 Star Rating" },
    { icon: <Zap className="w-8 h-8 text-purple-500" />, name: "Quick Resolver", desc: "Fast Solutions" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Award className="w-6 h-6 text-yellow-500" />
        Your Achievements
      </h2>
      <div className="grid grid-cols-2 gap-4 text-center">
        {badges.map((badge) => (
          <div key={badge.name} className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center">
            {badge.icon}
            <p className="font-semibold mt-2">{badge.name}</p>
            <p className="text-xs text-gray-500">{badge.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformancePage;
