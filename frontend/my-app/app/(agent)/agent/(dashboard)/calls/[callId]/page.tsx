"use client";

import React, { useState, useEffect, use } from "react";
import {
  Phone, BarChart3, ChevronLeft, Download, Copy, FileText, File,
  CheckCircle, Flag, User, Mic, Clock, Calendar, Mail, Loader, AlertCircle, LucideIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { baseURL } from "@/lib/api";

// --- Types ---

type CallStatus = "Completed" | "Ongoing" | "Failed" | "Initiated";

interface Call {
  id: string;
  callId: string;
  date: string;
  time: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  duration: string;
  status: CallStatus;
  recordingUrl?: string;
  agent?: {
      name: string;
  };
}

interface TranscriptSegment {
  speaker: string;
  text: string;
  startTime?: number;
  endTime?: number;
  start?: number;
  end?: number;
  confidence?: number;
}

interface Transcription {
  status: string;
  conversation?: TranscriptSegment[];
  segments?: TranscriptSegment[];
  fullText?: string;
}

interface CallAnalysis {
  summary: {
    brief: string;
    keyPoints: string[];
    outcome: string;
  };
  sentiment: {
    overall: string;
    scores: {
      overall: number;
      customer: number;
      agent: number;
    };
  };
  topics: {
    main: string;
    tags: string[];
    subTopics?: string[];
  };
  actionItems: {
    customerTasks: Array<{ task: string; priority: string }>;
    agentFollowUps: Array<{ action: string; status: string }>;
    promisesMade: string[];
  };
  issues: {
    primary: string;
    status: string;
    severity: string;
  };
  agentPerformance: {
    strengths: string[];
    areasForImprovement: string[];
    scores: {
      overall: number;
      communication: number;
      empathy: number;
      problemSolving: number;
    };
  };
  customerExperience: {
    satisfactionIndicators: string[];
    painPoints: string[];
    effortLevel: string;
  };
  recommendations: {
    forAgent: string[];
    forManager: string[];
  };
}

type Tab = "overview" | "transcript" | "analysis";

// --- Main Page Component ---

export default function CallDetailPage({ params }: { params: Promise<{ callId: string }> }) {
  // Unwrap params using React.use()
  const { callId } = use(params);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "overview";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  
  // Data State
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sync activeTab with URL param if it changes externally or on first load
    const tabFromUrl = searchParams.get("tab") as Tab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Use replace to avoid building up history stack for tab changes
    router.replace(`/agent/calls/${callId}?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    const fetchCallData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('agent-token');
        if (!token) throw new Error("No authentication token found");

        const callsRes = await fetch(`${baseURL}/calls/my-calls`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // This is a workaround since we don't have a direct single-call endpoint confirmed.
        // We fetch the list and find the relevant call.
        let foundCall: Call | null = null;

        if (callsRes.ok) {
            const data = await callsRes.json();
            // Match against either _id or callId (UUID)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawCall = data.calls.find((c: any) => c.callId === callId || c._id === callId);
            
            if (rawCall) {
                 const startTime = new Date(rawCall.startTime);
                 const durationInSeconds = rawCall.duration || 0;
                 const minutes = Math.floor(durationInSeconds / 60);
                 const seconds = durationInSeconds % 60;
                 
                 foundCall = {
                    id: rawCall._id,
                    callId: rawCall.callId,
                    date: startTime.toLocaleDateString('en-CA'),
                    time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    customer: {
                        name: rawCall.customer?.name || 'Unknown Customer',
                        email: rawCall.customer?.email || 'No email',
                        phone: rawCall.customer?.phone || 'N/A'
                    },
                    duration: `${minutes}m ${seconds}s`,
                    status: (rawCall.status.charAt(0).toUpperCase() + rawCall.status.slice(1)) as CallStatus,
                    recordingUrl: rawCall.recordingUrl,
                    agent: rawCall.agent
                 };
            }
        }

        if (!foundCall) {
            throw new Error("Call not found.");
        }

        setCall(foundCall);

      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (callId) {
        fetchCallData();
    }
  }, [callId]);

  if (loading) {
    return (
        <div className="flex bg-gray-50 h-screen items-center justify-center">
            <div className="flex flex-col items-center">
                <Loader className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-600 font-medium">Loading call details...</p>
            </div>
        </div>
    );
  }

  if (error || !call) {
     return (
        <div className="flex bg-gray-50 h-screen items-center justify-center">
             <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-100 max-w-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Call</h2>
                <p className="text-gray-600 mb-6">{error || "Call not found"}</p>
                <Link 
                    href="/agent/calls" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                    <ChevronLeft size={20} className="mr-2" /> Back to Call History
                </Link>
             </div>
        </div>
     );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans flex-col">
        <main className="flex-1 overflow-y-auto p-6">
          <CallHeaderCard call={call} />
          <div className="mt-8">
            <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
            <div className="mt-6">
              {activeTab === 'overview' && <OverviewTab call={call} />}
              {activeTab === 'transcript' && <TranscriptTab callId={call.callId} />}
              {activeTab === 'analysis' && <AnalysisTab callId={call.callId} />}
            </div>
          </div>
        </main>
    </div>
  );
}

// --- Sub Components ---



const CallHeaderCard = ({ call }: { call: Call }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
    <div className="flex items-center gap-6 w-full md:w-auto">
      <div className="w-20 h-20 rounded-full border-4 border-indigo-50 bg-indigo-100 flex items-center justify-center shrink-0">
        <User size={36} className="text-indigo-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{call.customer.name}</h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
            <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span>{call.customer.email}</span>
            </div>
            {call.customer.phone && (
                <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span>{call.customer.phone}</span>
                </div>
            )}
            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span>{call.date} • {call.time}</span>
            </div>
        </div>
      </div>
    </div>
    
    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
      <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 border ${
          call.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 
          call.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
          'bg-gray-50 text-gray-700 border-gray-100'
      }`}>
         {call.status === 'Completed' && <CheckCircle size={16} />}
         {call.status === 'Ongoing' && <Loader size={16} className="animate-spin" />}
         {call.status}
      </div>
      <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
         <Clock size={16} />
         Duration: <span className="text-gray-900">{call.duration}</span>
      </div>
    </div>
  </div>
);

const TabNavigation = ({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void; }) => {
  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Overview', icon: File },
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 gap-2
                ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Icon size={18} className={activeTab === tab.id ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const OverviewTab = ({ call }: { call: Call }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <File className="text-indigo-500" size={20} /> Call Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InfoItem label="Call ID" value={call.callId} />
                 <InfoItem label="Agent" value={call.agent?.name || "Unknown Agent"} />
                 <InfoItem label="Date" value={call.date} />
                 <InfoItem label="Time" value={call.time} />
                 <InfoItem label="Duration" value={call.duration} />
                 <InfoItem label="Status" value={call.status} highlight={call.status === "Completed"} />
            </div>
        </div>
    </div>
    <div className="lg:col-span-1">
       {call.recordingUrl ? (
           <RecordingPlayerCard url={call.recordingUrl} />
       ) : (
           <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center h-full">
               <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Mic size={32} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-900">No Recording</h3>
               <p className="text-gray-500 mt-2 text-sm">A recording is not available for this call.</p>
           </div>
       )}
    </div>
  </div>
);

const InfoItem = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div>
        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</dt>
        <dd className={`text-base font-semibold ${highlight ? 'text-green-600' : 'text-gray-900'} break-words`}>{value}</dd>
    </div>
);

const RecordingPlayerCard = ({ url }: { url: string }) => {
    // Note: For a real app, integrate a proper audio player.
    // This is a simplified UI control concept.
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Mic size={20} className="text-indigo-500" /> Recording
            </h3>
            <audio controls src={url} className="w-full mb-4 rounded-lg" />
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Download Audio</span>
                <a href={url} download className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <Download size={20} />
                </a>
            </div>
        </div>
    );
};

const TranscriptTab = ({ callId }: { callId: string }) => {
    const [transcription, setTranscription] = useState<Transcription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTranscription = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('agent-token');
                if (!token) throw new Error("No auth token");
                
                const res = await fetch(`${baseURL}/transcriptions/${callId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) {
                    if (res.status === 404) {
                         setError("No transcription available yet.");
                         return;
                    }
                    throw new Error("Failed to fetch transcript");
                }
                
                const data = await res.json();
                setTranscription(data.transcription);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchTranscription();
    }, [callId]);

    const formatTime = (seconds?: number) => {
        if (seconds === undefined) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="p-12 text-center text-gray-500"><Loader className="w-8 h-8 animate-spin mx-auto mb-2" /> Loading transcript...</div>;
    
    if (error) return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">{error}</h3>
             <p className="text-gray-500 mt-2">The transcription might still be processing.</p>
        </div>
    );

    if (!transcription) return null;

    const messages = transcription.conversation || transcription.segments || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                 <h3 className="font-semibold text-gray-700">Conversation</h3>
                 <div className="flex gap-2">
                     <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors" title="Copy Text">
                         <Copy size={18} />
                     </button>
                     <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors" title="Download">
                         <Download size={18} />
                     </button>
                 </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length > 0 ? (
                    messages.map((msg, idx) => {
                        const isAgent = msg.speaker.toLowerCase() === 'agent';
                        const startTime = msg.start ?? msg.startTime;
                        return (
                             <div key={idx} className={`flex gap-4 ${isAgent ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAgent ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {isAgent ? <User size={20} /> : <User size={20} />}
                                </div>
                                <div className={`max-w-[75%] space-y-1`}>
                                    <div className={`flex items-center gap-2 text-xs text-gray-500 ${isAgent ? 'justify-end' : ''}`}>
                                        <span className="font-semibold">{msg.speaker}</span>
                                        <span>•</span>
                                        <span className="font-mono">{formatTime(startTime)}</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isAgent ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                             </div>
                        );
                    })
                ) : (
                    <div className="p-8 bg-gray-50 rounded-lg text-gray-600 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {transcription.fullText || "No text content available."}
                    </div>
                )}
            </div>
        </div>
    );
};

const AnalysisTab = ({ callId }: { callId: string }) => {
    const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
             setLoading(true);
             try {
                const token = localStorage.getItem('agent-token');
                if (!token) throw new Error("No auth token");
                
                const res = await fetch(`${baseURL}/analysis/${callId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) {
                    if (res.status === 404) {
                        setError("Analysis not available yet.");
                        return;
                    }
                    throw new Error("Failed to fetch analysis");
                }
                
                const data = await res.json();
                setAnalysis(data.analysis);
             } catch (err) {
                 setError((err as Error).message);
             } finally {
                 setLoading(false);
             }
        };
        fetchAnalysis();
    }, [callId]);

    const getSentimentColor = (sentiment?: string) => {
        const s = sentiment?.toLowerCase() || '';
        if (s.includes('positive')) return 'bg-green-100 text-green-800 border-green-200';
        if (s.includes('negative')) return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    };

    if (loading) return <div className="p-12 text-center text-gray-500"><Loader className="w-8 h-8 animate-spin mx-auto mb-2" /> Loading insights...</div>;
    
    if (error) return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} className="text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">{error}</h3>
             <p className="text-gray-500 mt-2">Analysis usually takes a few minutes after the call ends.</p>
        </div>
    );

    if (!analysis) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             {/* Key Metrics */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <h4 className="text-sm font-medium text-gray-500 mb-2">Overall Sentiment</h4>
                     <div className="flex items-center gap-3">
                         <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSentimentColor(analysis.sentiment?.overall)}`}>
                             {analysis.sentiment?.overall || 'Neutral'}
                         </div>
                         {analysis.sentiment?.scores?.overall && (
                             <span className="text-2xl font-bold text-gray-900">{Math.round(analysis.sentiment.scores.overall * 100)}%</span>
                         )}
                     </div>
                     {/* Bars */}
                     <div className="mt-4 space-y-2">
                        <SentimentBar label="Customer" value={analysis.sentiment?.scores?.customer} />
                        <SentimentBar label="Agent" value={analysis.sentiment?.scores?.agent} />
                     </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <h4 className="text-sm font-medium text-gray-500 mb-2">Agent Score</h4>
                     <div className="flex items-center gap-3">
                         <span className="text-4xl font-bold text-indigo-600">{analysis.agentPerformance?.scores?.overall ?? '-'}</span>
                         <span className="text-sm text-gray-400 self-end mb-1">/ 10</span>
                     </div>
                     <div className="mt-4 flex flex-wrap gap-2">
                         {(analysis.agentPerformance?.strengths || []).slice(0, 2).map((s, i) => (
                             <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-100">
                                 ✅ {s}
                             </span>
                         ))}
                     </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <h4 className="text-sm font-medium text-gray-500 mb-2">Resolution Status</h4>
                     <div className="flex items-center gap-2 mb-2">
                         <span className="text-lg font-semibold text-gray-900 capitalize">{analysis.issues?.status || 'Unknown'}</span>
                     </div>
                     <p className="text-sm text-gray-600 line-clamp-2">{analysis.summary?.outcome}</p>
                 </div>
             </div>

             {/* Summary & Topics */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={18} className="text-indigo-500"/> Executive Summary</h3>
                     <p className="text-gray-700 leading-relaxed text-sm mb-4">{analysis.summary?.brief}</p>
                     
                     <h4 className="font-semibold text-gray-800 text-sm mb-2">Key Points</h4>
                     <ul className="space-y-2">
                         {(analysis.summary?.keyPoints || []).map((point, i) => (
                             <li key={i} className="flex gap-2 text-sm text-gray-600">
                                 <div className="min-w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2"></div>
                                 {point}
                             </li>
                         ))}
                     </ul>
                 </div>

                 <div className="space-y-6">
                      {/* Topics */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Flag size={18} className="text-orange-500"/> Topics</h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                                  {analysis.topics?.main}
                              </span>
                              {(analysis.topics?.tags || []).map((tag, i) => (
                                  <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm border border-gray-100">
                                      #{tag}
                                  </span>
                              ))}
                          </div>
                      </div>

                      {/* Action Items */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> Action Items</h3>
                          {analysis.actionItems?.customerTasks?.length > 0 && (
                              <div className="mb-4">
                                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer Tasks</h5>
                                  <ul className="space-y-2">
                                      {analysis.actionItems.customerTasks.map((task, i) => (
                                          <li key={i} className="flex gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                                              <input type="checkbox" className="mt-0.5" disabled />
                                              <span className="flex-1">{task.task}</span>
                                              <span className="text-xs text-red-500 font-medium whitespace-nowrap">{task.priority} Priority</span>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          {analysis.actionItems?.agentFollowUps?.length > 0 && (
                              <div>
                                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agent Follow-up</h5>
                                  <ul className="space-y-2">
                                      {analysis.actionItems.agentFollowUps.map((action, i) => (
                                          <li key={i} className="flex gap-2 text-sm text-gray-700 bg-indigo-50 p-2 rounded-lg">
                                              <input type="checkbox" className="mt-0.5" disabled />
                                              <span>{action.action}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                           {!analysis.actionItems?.customerTasks?.length && !analysis.actionItems?.agentFollowUps?.length && (
                               <p className="text-gray-400 text-sm italic">No specific action items detected.</p>
                           )}
                      </div>
                 </div>
             </div>
        </div>
    );
};

const SentimentBar = ({ label, value }: { label: string, value?: number }) => {
    if (value === undefined) return null;
    const percentage = Math.round(value * 100);
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-16 text-gray-500">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full ${percentage > 60 ? 'bg-green-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className="w-8 text-right font-medium text-gray-700">{percentage}%</span>
        </div>
    );
};

// --- Sidebar & Header (Simplified) ---
