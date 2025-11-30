"use client"

import React from "react";
import {
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Award,
  Star,
  Trophy,
  Zap,
  Smile,
} from "lucide-react";


// Main Performance Page Component
const PerformancePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Performance</h1>
          <p className="text-md text-gray-500 mt-1">
            Track your progress and improvement areas
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <PerformanceScoreHero />
            <SkillBreakdown />
            <PerformanceTrendChart />
            <RecentCallScores />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <StrengthsWeaknesses />
            <Recommendations />
            <Achievements />
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Score Hero Section
const PerformanceScoreHero = () => (
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
          strokeDasharray="85, 100"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-gray-800 flex items-center">
          <Star className="w-8 h-8 text-yellow-400 mr-2" />
          8.5<span className="text-2xl text-gray-500">/10</span>
        </div>
        <div className="text-md text-gray-500">85% Complete</div>
      </div>
    </div>
    <p className="text-lg text-gray-600">
      Excellent! You're in the top 20%
    </p>
  </div>
);

// Skill Breakdown Section
const SkillBreakdown = () => {
  const skills = [
    { name: "Communication", score: 9.0, tip: "Your strongest skill", color: "blue-500" },
    { name: "Professionalism", score: 9.0, tip: "Consistently professional", color: "blue-500" },
    { name: "Empathy", score: 8.7, tip: "Great emotional intelligence", color: "purple-500" },
    { name: "Problem Solving", score: 8.2, tip: "Room for improvement", color: "purple-500" },
    { name: "Product Knowledge", score: 8.0, tip: "Consider additional training", color: "purple-500" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">📊 Skill Breakdown</h2>
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

// Performance Trend Chart Placeholder
const PerformanceTrendChart = () => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-xl font-bold mb-4">📈 Performance Over Time</h2>
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">[Line Chart Placeholder]</p>
    </div>
  </div>
);

// Recent Call Scores Section
const RecentCallScores = () => {
  const calls = [
    { id: 1, date: "Jan 15, 2024", customer: "John Doe", score: 9.2 },
    { id: 2, date: "Jan 14, 2024", customer: "Jane Smith", score: 8.0 },
    { id: 3, date: "Jan 13, 2024", customer: "Sam Wilson", score: 8.8 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">📞 Recent Call Performance</h2>
      <div className="space-y-4">
        {calls.map((call, index) => (
          <div key={call.id}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Call #{call.id} - {call.date}</p>
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
        ))}
      </div>
      <div className="mt-6 text-center">
        <a href="#" className="text-blue-500 font-semibold hover:underline">
          View All Calls →
        </a>
      </div>
    </div>
  );
};

// Strengths vs Weaknesses Section
const StrengthsWeaknesses = () => (
  <div className="bg-white rounded-xl shadow-md">
    <div className="grid grid-cols-2 divide-x divide-gray-200">
      <div className="p-4">
        <h3 className="font-bold flex items-center mb-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" /> Your Strengths
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start"><span className="mr-2"> • </span>Clear communication</li>
          <li className="flex items-start"><span className="mr-2"> • </span>Patient approach</li>
          <li className="flex items-start"><span className="mr-2"> • </span>Active listening</li>
        </ul>
      </div>
      <div className="p-4">
        <h3 className="font-bold flex items-center mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" /> Focus Areas
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start"><span className="mr-2"> • </span>Product knowledge gaps</li>
          <li className="flex items-start"><span className="mr-2"> • </span>Could be more proactive</li>
          <li className="flex items-start"><span className="mr-2"> • </span>Faster problem resolution</li>
        </ul>
      </div>
    </div>
  </div>
);

// Recommendations Section
const Recommendations = () => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-xl font-bold mb-4">💡 Personalized Recommendations</h2>
    <div>
      <h3 className="font-semibold mb-3">📚 Suggested Training:</h3>
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="font-semibold">Advanced Product Knowledge</p>
          <p className="text-sm text-gray-500 mb-2">Duration: 2 hours</p>
          <button className="text-sm font-semibold text-blue-500 hover:underline">Start Training →</button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="font-semibold">Effective Problem Solving</p>
          <p className="text-sm text-gray-500 mb-2">Duration: 1 hour</p>
          <button className="text-sm font-semibold text-blue-500 hover:underline">Start Training →</button>
        </div>
      </div>
    </div>
    <div className="mt-6">
      <h3 className="font-semibold mb-3">🎯 This Week's Goals:</h3>
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
      <h2 className="text-xl font-bold mb-4">🏆 Your Achievements</h2>
      <div className="grid grid-cols-2 gap-4 text-center">
        {badges.map((badge) => (
          <div key={badge.name} className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center">
            {badge.icon}
            <p className="font-semibold mt-2">{badge.name}</p>
            <p className="text-xs text-gray-500">{badge.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <a href="#" className="text-blue-500 font-semibold hover:underline">
          View All Badges →
        </a>
      </div>
    </div>
  );
};

export default PerformancePage;