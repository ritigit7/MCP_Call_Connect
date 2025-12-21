"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard, Phone, BarChart3, Target, Settings, LogOut, ChevronDown, Bell, Search, Clock, MoreHorizontal,
  ChevronLeft, ChevronRight, Menu, X, Share2, Download, Play, Pause, Volume2, Copy, FileText, File, Search as SearchIcon,
  Paperclip, Star, Smile, Meh, Frown, CheckCircle, Info, AlertTriangle, ArrowRight, Bot, BrainCircuit, ClipboardCheck,
  UserCheck, TrendingUp, Book, Lightbulb, Flag,
  User
} from "lucide-react";
import Link from "next/link";

type AgentStatus = "Online" | "Busy" | "Offline";
type Tab = "overview" | "transcript" | "analysis";

const CallDetailPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "lg:ml-[250px]" : "lg:ml-[80px]"}`}>
        <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <Breadcrumb />
          <CallHeaderCard />
          <div className="mt-6">
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-6">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'transcript' && <TranscriptTab />}
              {activeTab === 'analysis' && <AnalysisTab />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const Breadcrumb = () => (
  <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
    <ol className="list-none p-0 inline-flex">
      <li className="flex items-center">
        <Link href="/agent/dashboard" className="hover:text-indigo-600">Dashboard</Link>
      </li>
      <li className="flex items-center mx-2">
        <ChevronRight size={16} />
      </li>
      <li className="flex items-center">
        <Link href="/agent/calls" className="hover:text-indigo-600">Call History</Link>
      </li>
      <li className="flex items-center mx-2">
        <ChevronRight size={16} />
      </li>
      <li className="text-gray-700 font-medium">Call #12345</li>
    </ol>
  </nav>
);

const CallHeaderCard = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between">
    <div className="flex items-center gap-5">
      <div className="w-20 h-20 rounded-full border-4 border-gray-100 bg-indigo-100 flex items-center justify-center">
        <User size={40} className="text-indigo-600" />
      </div>
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="font-semibold text-gray-500">Customer:</div>
          <div className="text-gray-800 font-bold">John Doe</div>

          <div className="font-semibold text-gray-500">Agent:</div>
          <div className="text-gray-800 font-bold">Sarah Smith</div>

          <div className="font-semibold text-gray-500">Duration:</div>
          <div className="text-gray-800 font-bold">5m 32s</div>

          <div className="font-semibold text-gray-500">Status:</div>
          <div className="flex items-center gap-1">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-green-700 font-bold">Completed</span>
          </div>

          <div className="font-semibold text-gray-500">Date:</div>
          <div className="text-gray-800 font-bold">Jan 15, 2024 10:30 AM</div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3 mt-4 md:mt-0">
      <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">
        <Download size={16} />
        <span>Download</span>
      </button>
      <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">
        <Share2 size={16} />
        <span>Share</span>
      </button>
    </div>
  </div>
);

const TabNavigation = ({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void; }) => {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'analysis', label: 'Analysis' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

const OverviewTab = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetadataGrid />
    </div>
    <div className="lg:col-span-3">
      <RecordingPlayerCard />
    </div>
  </div>
);

const MetadataGrid = () => {
  const items = [
    { label: 'Call ID', value: '#12345' },
    { label: 'Duration', value: '5m 32s' },
    { label: 'Start Time', value: '10:30 AM' },
    { label: 'End Time', value: '10:35 AM' },
    { label: 'Customer Email', value: 'john@example.com' },
    { label: 'Customer Phone', value: '+1-555-1234' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 col-span-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map(item => (
                <div key={item.label}>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="text-base font-bold text-gray-800 mt-1">{item.value}</p>
                </div>
            ))}
        </div>
    </div>
  );
};

const RecordingPlayerCard = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(40); // Example progress
    const [volume, setVolume] = useState(75);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                🎙️ Call Recording
            </h3>
            <div className="mt-4 flex items-center gap-4">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                    {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
                <div className="flex-grow flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-600">2:15</span>
                    <div className="w-full bg-gray-200 rounded-full h-2 group">
                        <div className="bg-indigo-500 h-2 rounded-full relative" style={{ width: `${progress}%` }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                    <span className="text-sm font-mono text-gray-600">5:32</span>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <button className="text-sm font-semibold text-gray-700 bg-gray-100 h-9 px-3 rounded-lg flex items-center gap-1">
                            {playbackSpeed}x <ChevronDown size={16} />
                        </button>
                        <div className="absolute bottom-full mb-2 w-24 bg-white rounded-lg shadow-lg p-1 hidden group-hover:block">
                            {[1, 1.5, 2].map(speed => (
                                <button key={speed} onClick={() => setPlaybackSpeed(speed)} className="w-full text-left text-sm px-3 py-1.5 rounded-md hover:bg-gray-100">{speed}x</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 group">
                        <Volume2 size={20} className="text-gray-500" />
                        <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-24 h-1 accent-indigo-500" />
                    </div>
                </div>
                <button className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-indigo-600 font-semibold text-sm transition-colors hover:bg-indigo-50">
                    <Download size={16} />
                    <span>Download</span>
                </button>
            </div>
        </div>
    );
};

const TranscriptTab = () => {
    const transcript = [
        { speaker: 'Agent', time: '00:05', text: 'Hello, thank you for calling. My name is Sarah. How can I help you today?', avatar: '👨‍💼' },
        { speaker: 'Customer', time: '00:12', text: 'Hi Sarah, I have a question about my recent bill. It seems higher than usual.', avatar: '👤' },
        { speaker: 'Agent', time: '00:18', text: 'I can certainly look into that for you. Could you please provide me with your account number?', avatar: '👨‍💼' },
        { speaker: 'Customer', time: '00:25', text: 'Sure, it\'s 555-1234. I also noticed my payment method seems to have expired.', avatar: '👤' },
        { speaker: 'Agent', time: '00:32', text: 'Thank you. Yes, I see the issue. The system tried to process the payment with an expired card. We can update that for you right now.', avatar: '👨‍💼' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Conversation Transcript</h3>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><SearchIcon size={18} /></button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><Copy size={18} /></button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><FileText size={18} /></button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><File size={18} /></button>
                </div>
            </div>
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {transcript.map((entry, index) => (
                    <div key={index} className={`flex flex-col ${entry.speaker === 'Customer' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">{entry.avatar} {entry.speaker}</span>
                            <span className="text-xs text-gray-400">[{entry.time}]</span>
                        </div>
                        <div className={`max-w-[70%] p-4 rounded-xl ${entry.speaker === 'Customer' ? 'bg-gray-100 text-gray-800 rounded-br-none' : 'bg-indigo-50 text-indigo-900 rounded-bl-none'}`}>
                            <p className="text-sm">{entry.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AnalysisTab = () => {
    const analysisSections = [
        { title: "Summary", icon: "1️⃣", component: <SummaryCard /> },
        { title: "Sentiment Analysis", icon: "2️⃣", component: <SentimentCard /> },
        { title: "Topics & Categories", icon: "3️⃣", component: <TopicsCard /> },
        { title: "Action Items", icon: "4️⃣", component: <ActionItemsCard /> },
        { title: "Issues", icon: "5️⃣", component: <IssuesCard /> },
        { title: "Agent Performance", icon: "6️⃣", component: <AgentPerformanceCard /> },
        { title: "Customer Experience", icon: "7️⃣", component: <CustomerExperienceCard /> },
        { title: "Compliance", icon: "8️⃣", component: <ComplianceCard /> },
        { title: "Business Insights", icon: "9️⃣", component: <BusinessInsightsCard /> },
        { title: "Recommendations", icon: "🔟", component: <RecommendationsCard /> },
    ];

    return (
        <div className="space-y-4">
            <RiskAssessmentCard />
            {analysisSections.map(section => (
                <AccordionCard key={section.title} title={section.title} icon={section.icon}>
                    {section.component}
                </AccordionCard>
            ))}
        </div>
    );
};

const AccordionCard = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="bg-white rounded-xl shadow-sm transition-shadow hover:shadow-md">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-5 text-left">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-3">
                    <span>{icon}</span>
                    {title}
                </h3>
                <ChevronDown size={20} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="px-5 pb-5 border-t border-gray-200 pt-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

const SummaryCard = () => (
    <div>
        <h4 className="font-semibold text-gray-700">📝 Brief Summary:</h4>
        <p className="text-sm text-gray-600 mt-1">Customer inquired about a higher-than-expected bill, which was caused by a failed payment from an expired credit card. The agent helped the customer update their payment method and resolved the issue.</p>
        <h4 className="font-semibold text-gray-700 mt-4">🔑 Key Points:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
            <li>Payment method issue identified.</li>
            <li>Account payment information update required.</li>
            <li>Issue was resolved successfully during the call.</li>
        </ul>
        <div className="mt-4 flex items-center gap-2">
            <h4 className="font-semibold text-gray-700">✅ Outcome:</h4>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Resolved</span>
        </div>
    </div>
);

const SentimentCard = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-4">
            <div className="font-semibold text-gray-700">Overall:</div>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">😊 Positive</span>
        </div>
        {/* Mock Chart */}
        <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-2">📈 Sentiment Timeline:</h4>
            <div className="w-full h-24 bg-gray-50 rounded-lg flex items-end justify-center p-2 border border-gray-200">
                <p className="text-xs text-gray-400">[Line Chart showing sentiment over time]</p>
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-2">📊 Scores:</h4>
            <div className="space-y-2 text-sm">
                <ProgressBar label="Overall" value={70} />
                <ProgressBar label="Customer" value={60} />
                <ProgressBar label="Agent" value={90} />
            </div>
        </div>
    </div>
);

const ProgressBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-3">
        <span className="w-24 text-gray-600">{label}</span>
        <div className="flex-grow bg-gray-200 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
        </div>
        <span className="w-10 font-mono text-gray-800">{(value / 100).toFixed(1)}</span>
    </div>
);

const TopicsCard = () => (
    <div className="space-y-4">
        <div>
            <h4 className="font-semibold text-gray-700">🎯 Main Topic:</h4>
            <div className="mt-2"><span className="px-4 py-1.5 text-sm font-bold rounded-full bg-blue-100 text-blue-800">Billing Support</span></div>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700">📌 Sub-topics:</h4>
            <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-800">Payment Issue</span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-800">Account Update</span>
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700">🏢 Department:</h4>
            <p className="text-sm text-gray-600 mt-1">Customer Support</p>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700">🏷️ Tags:</h4>
            <p className="text-sm text-indigo-700 mt-1">#billing #payment #support</p>
        </div>
    </div>
);

const ActionItemsCard = () => (
    <div className="space-y-4">
        <div>
            <h4 className="font-semibold text-gray-700">👤 Customer Tasks:</h4>
            <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                        <p>Update payment method</p>
                        <p className="text-xs text-gray-500">Deadline: Within 24 hours | Priority: <span className="text-red-600 font-semibold">🔴 High</span></p>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700">👨‍💼 Agent Follow-ups:</h4>
            <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg border">
                 <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                        <p>Send confirmation email</p>
                        <p className="text-xs text-gray-500">Status: <span className="font-semibold">Pending</span></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const IssuesCard = () => (
    <div className="space-y-4 text-sm">
        <div>
            <h4 className="font-semibold text-gray-700">⚠️ Primary Issue:</h4>
            <p className="text-base font-bold text-gray-800 mt-1">Failed payment processing</p>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700">Secondary Issues:</h4>
            <ul className="list-disc list-inside text-gray-600 mt-1">
                <li>Expired credit card</li>
                <li>No backup payment method</li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700">🔍 Root Cause:</h4>
            <p className="text-gray-600 mt-1">Credit card expired last month.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2">
            <div><h4 className="font-semibold text-gray-700">Severity:</h4><p className="text-gray-600 mt-1">🟡 Medium</p></div>
            <div><h4 className="font-semibold text-gray-700">Status:</h4><p className="text-gray-600 mt-1">✅ Resolved</p></div>
            <div><h4 className="font-semibold text-gray-700">Resolution Time:</h4><p className="text-gray-600 mt-1">5m 32s</p></div>
        </div>
    </div>
);

const AgentPerformanceCard = () => (
    <div className="space-y-5">
        <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="stroke-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                    <path className="stroke-indigo-500" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" strokeLinecap="round"></path>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">8.5</span>
                    <span className="text-xs text-gray-500">/ 10</span>
                </div>
            </div>
            <div className="flex-grow space-y-2 text-sm">
                <ProgressBar label="Communication" value={90} />
                <ProgressBar label="Empathy" value={87} />
                <ProgressBar label="Problem Solving" value={82} />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
                <h4 className="font-semibold text-gray-700 mb-1">✅ Strengths:</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Clear communication</li>
                    <li>Patient approach</li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700 mb-1">⚠️ Areas for Improvement:</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Could offer more alternatives</li>
                </ul>
            </div>
        </div>
    </div>
);

const CustomerExperienceCard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
            <h4 className="font-semibold text-gray-700 mb-1">😊 Satisfaction Indicators:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Thanked agent multiple times</li>
                <li>Positive tone throughout</li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700 mb-1">😟 Pain Points:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Had to call multiple times previously</li>
                <li>Confusion about process</li>
            </ul>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-2 border-t">
            <div><h4 className="font-semibold text-gray-700">Effort Level:</h4><p className="text-gray-600 mt-1">✅ Easy</p></div>
            <div><h4 className="font-semibold text-gray-700">Repeat Call:</h4><p className="text-gray-600 mt-1">⚠️ Yes (3rd attempt)</p></div>
        </div>
    </div>
);

const ComplianceCard = () => (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Greeting Quality: Proper</div>
        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Closing Quality: Proper</div>
        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Policy Adherence: Yes</div>
        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Data Security: Followed</div>
        <div className="col-span-2 pt-2 border-t">
            <h4 className="font-semibold text-gray-700 mb-1">⚠️ Violations:</h4>
            <p className="text-gray-600">None</p>
        </div>
    </div>
);

const BusinessInsightsCard = () => (
    <div className="space-y-4 text-sm">
        <div>
            <h4 className="font-semibold text-gray-700">💡 Feature Requests:</h4>
            <div className="text-gray-600 mt-1 p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                <ul className="list-disc list-inside">
                    <li>Auto-update payment methods</li>
                    <li>Card expiry notifications</li>
                </ul>
                <button className="text-indigo-600 font-semibold flex items-center gap-1 text-xs">Forward <ArrowRight size={14} /></button>
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700">📝 Product Feedback:</h4>
            <p className="text-gray-600 mt-1">Payment system needs improvement for proactive reminders.</p>
        </div>
    </div>
);

const RecommendationsCard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
            <h4 className="font-semibold text-gray-700 mb-1">👨‍💼 For Agent:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Excellent work on resolution</li>
                <li>Continue patient approach</li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold text-gray-700 mb-1">👔 For Manager:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Share as best practice example</li>
            </ul>
        </div>
        <div className="md:col-span-2 pt-4 border-t">
            <h4 className="font-semibold text-gray-700 mb-1">🎯 For Product Team:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Implement payment reminder feature</li>
            </ul>
        </div>
    </div>
);

const RiskAssessmentCard = () => (
    <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-3 mb-3">
            <Flag size={20} className="text-red-500" />
            Risk Assessment
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
                <p className="font-semibold text-gray-500">Churn Risk</p>
                <p className="font-bold text-green-700 mt-1">🟢 Low</p>
            </div>
            <div>
                <p className="font-semibold text-gray-500">Escalation</p>
                <p className="font-bold text-gray-800 mt-1">❌ No</p>
            </div>
            <div>
                <p className="font-semibold text-gray-500">Legal Risk</p>
                <p className="font-bold text-gray-800 mt-1">❌ No</p>
            </div>
            <div>
                <p className="font-semibold text-gray-500">VIP Customer</p>
                <p className="font-bold text-gray-800 mt-1">❌ No</p>
            </div>
        </div>
    </div>
);


// NOTE: Simplified Sidebar and Header components for brevity.
// These would be the same as in other agent pages.

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean; setIsSidebarOpen: (isOpen: boolean) => void; }) => {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/agent/dashboard" },
    { icon: Phone, label: "Call History", href: "/agent/calls" },
    { icon: BarChart3, label: "Analytics", href: "#" },
    { icon: Target, label: "Performance", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <>
      <div className={`fixed top-0 left-0 h-full bg-[#1F2937] text-white transition-all duration-300 z-30 ${isSidebarOpen ? "w-[250px]" : "w-0 lg:w-[80px]"} overflow-hidden`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center gap-3 px-6 h-[70px] border-b border-gray-700 ${!isSidebarOpen && "lg:justify-center"}`}>
            <Phone className="h-10 w-10 text-indigo-400" />
            <span className={`text-xl font-bold ${!isSidebarOpen && "lg:hidden"}`}>Call Center</span>
          </div>
          <div className={`px-6 py-4 border-b border-gray-700 ${!isSidebarOpen && "lg:px-0"}`}>
            <div className={`flex items-center gap-3 ${!isSidebarOpen && "lg:flex-col lg:gap-2 lg:justify-center"}`}>
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <User size={28} className="text-indigo-600" />
              </div>
              <div className={`${!isSidebarOpen && "lg:hidden"}`}>
                <p className="font-semibold text-base">Sarah Smith</p>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className={`h-2 w-2 rounded-full bg-green-500`}></span>
                  Online
                </div>
              </div>
            </div>
          </div>
          <nav className="flex-1 py-4">
            <ul>
              {navItems.map((item) => (
                <li key={item.label} className="px-6 relative">
                  <Link href={item.href} className={`flex items-center gap-4 h-12 rounded-lg px-4 transition-colors ${item.label === 'Call History' ? "bg-gray-700/50 text-white" : "text-gray-400 hover:bg-gray-700/30 hover:text-white"} ${!isSidebarOpen && "lg:justify-center"}`}>
                    <item.icon size={20} />
                    <span className={`${!isSidebarOpen && "lg:hidden"}`}>{item.label}</span>
                    {item.label === 'Call History' && <div className="absolute left-0 h-8 w-1 bg-blue-500 rounded-r-full"></div>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-6 py-4 border-t border-gray-700">
            <a href="#" className={`flex items-center gap-4 h-12 rounded-lg px-4 text-red-400 hover:bg-red-900/30 hover:text-red-300 ${!isSidebarOpen && "lg:justify-center"}`}>
              <LogOut size={20} />
              <span className={`${!isSidebarOpen && "lg:hidden"}`}>Logout</span>
            </a>
          </div>
        </div>
      </div>
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 lg:hidden"></div>}
    </>
  );
};

const Header = ({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean; setIsSidebarOpen: (isOpen: boolean) => void; }) => {
  return (
    <header className="flex h-[70px] items-center justify-between border-b bg-white px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-2xl font-bold text-gray-800 hidden lg:block">Agent Portal</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." className="h-10 w-64 rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm" />
        </div>
        <button className="relative rounded-full p-2 hover:bg-gray-100">
          <Bell size={24} className="text-gray-600" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <User size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">Sarah Smith</p>
            <p className="text-xs text-gray-500">Agent</p>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </header>
  );
};

export default CallDetailPage;