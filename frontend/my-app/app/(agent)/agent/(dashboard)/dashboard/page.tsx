"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  Clock,
  PhoneIncoming,
  Star,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Mic,
  PhoneOff,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { baseURL } from "@/lib/api";
import { useSocket } from "@/lib/socket-context";

// type AgentStatus = "Online" | "Busy" | "Offline";
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

interface Customer {
  name: string;
  email: string;
  socketId?: string;
}

interface IncomingCallData {
  callId: string;
  customer: Customer;
}

interface WebRTCOfferData {
  offer: RTCSessionDescriptionInit;
  callId: string;
}

interface ICECandidateData {
  candidate: RTCIceCandidateInit;
  callId: string;
}

const AgentDashboardPage = () => {
  const [isCallIncoming, setIsCallIncoming] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { socket, isConnected } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  // const [isCallActive, setIsCallActive] = useState(false); // Already defined
  // const [callDuration, setCallDuration] = useState(0); // Defined in ActiveCallView, maybe move up?

  // WebRTC Refs
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentCallId = useRef<string | null>(null);

  const setupWebRTC = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc:ice-candidate', {
            target: incomingCall?.customer?.socketId, // We need customer socket ID? 
            // The server might handle routing based on callId or we need to send to specific target
            // In index.html: socket.emit('webrtc:ice-candidate', { candidate: event.candidate, to: currentCallId }); 
            // Actually index.html sends: socket.emit('webrtc:ice-candidate', { candidate: event.candidate, callId: currentCallId });
            callId: currentCallId.current,
            candidate: event.candidate
          });
        }
      };

      peerConnection.current = pc;
    } catch (err) {
      console.error("Error setting up WebRTC:", err);
    }
  }, [socket, incomingCall]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) {
      await setupWebRTC();
    }

    if (!peerConnection.current) return;

    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    if (socket && currentCallId.current) {
      socket.emit('webrtc:answer', {
        answer,
        callId: currentCallId.current
      });
    }
  }, [socket, setupWebRTC]);

  const endCallCleanup = useCallback(() => {
    setIsCallActive(false);
    setIncomingCall(null);
    currentCallId.current = null;

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const agentId = localStorage.getItem('agent-id');
    if (agentId) {
      socket.emit('agent:join', { agentId });
    }

    const onIncomingCall = (data: IncomingCallData) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);
      currentCallId.current = data.callId;
    };

    const onCallEnded = () => {
      endCallCleanup();
    };

    const onWebRTCOffer = async (data: WebRTCOfferData) => {
      console.log('Received WebRTC offer');
      await handleOffer(data.offer);
    };

    const onICECandidate = async (data: ICECandidateData) => {
      if (peerConnection.current && data.candidate) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      }
    };

    socket.on('call:incoming', onIncomingCall);
    socket.on('call:ended', onCallEnded);
    socket.on('webrtc:offer', onWebRTCOffer);
    socket.on('webrtc:ice-candidate', onICECandidate);

    return () => {
      socket.off('call:incoming', onIncomingCall);
      socket.off('call:ended', onCallEnded);
      socket.off('webrtc:offer', onWebRTCOffer);
      socket.off('webrtc:ice-candidate', onICECandidate);
    };
  }, [socket, isConnected, handleOffer, endCallCleanup]);

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
          // Handle potential errors from either request
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


  const handleAcceptCall = async () => {
    if (!incomingCall || !socket) return;
    socket.emit('call:accept', { callId: incomingCall.callId });
    setIsCallActive(true);
    setIsCallIncoming(false);
    await setupWebRTC();
  };

  const handleRejectCall = () => {
    setIsCallIncoming(false);
  };

  const handleEndCall = () => {
    if (socket && currentCallId.current) {
      socket.emit('call:end', { callId: currentCallId.current });
    }
    endCallCleanup();
  };

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay />
      {isCallActive ? (
        <ActiveCallView onEndCall={handleEndCall} />
      ) : (
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
      )}
      {(incomingCall || isCallIncoming) && (
        <IncomingCallModal
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          customerName={incomingCall?.customer?.name || "Unknown Customer"}
          customerEmail={incomingCall?.customer?.email || "No email"}
        />
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
  const circumference = 2 * Math.PI * 18; // 2 * pi * r
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
      // trend: "+12%", // This data is not available from the API
      // trendColor: "text-green-500",
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

const IncomingCallModal = ({ onAccept, onReject, customerName, customerEmail }: { onAccept: () => void; onReject: () => void; customerName: string; customerEmail: string; }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl animate-pulse-border">
        <style jsx>{`
          @keyframes pulse-border {
            0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(37, 99, 235, 0); }
            100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
          }
          .animate-pulse-border {
            animation: pulse-border 2s infinite;
          }
        `}</style>
        <h2 className="flex items-center justify-center gap-3 text-3xl font-bold text-gray-800">
          Incoming Call <PhoneIncoming className="animate-shake" />
        </h2>
        <div className="mt-6 flex flex-col items-center">
          <Image src="/avatars/02.png" alt="Customer" width={80} height={80} className="h-20 w-20 rounded-full border-4 border-gray-200" />
          <p className="mt-4 text-2xl font-bold text-gray-900">{customerName}</p>
          <p className="text-base text-gray-500">{customerEmail}</p>
          <p className="text-base text-gray-500">+1 (555) 123-4567</p>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={onAccept} className="flex h-14 w-[200px] items-center justify-center gap-2 rounded-lg bg-green-500 text-lg font-bold text-white transition hover:bg-green-600">
            Accept
          </button>
          <button onClick={onReject} className="flex h-14 w-[200px] items-center justify-center gap-2 rounded-lg bg-red-500 text-lg font-bold text-white transition hover:bg-red-600">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

const ActiveCallView = ({ onEndCall }: { onEndCall: () => void }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white shadow-2xl">
      <style jsx>{`
        @keyframes pulse-bar {
          0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
      <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
        {/* Customer Info */}
        <div className="flex flex-col items-center text-center">
          <Image src="/avatars/02.png" alt="Customer" width={96} height={96} className="h-24 w-24 rounded-full border-4 border-white/50" />
          <h2 className="mt-4 text-3xl font-bold">Jane Cooper</h2>
          <p className="text-lg text-white/80">Premium Customer</p>
        </div>

        {/* Call Info & Controls */}
        <div className="mt-8 flex-1 text-center md:mt-0">
          <div className="flex items-center justify-center gap-3 text-5xl font-mono tracking-widest">
            <Clock className="h-10 w-10" />
            <span>{formatDuration(callDuration)}</span>
          </div>

          <div className="my-8 flex h-16 items-center justify-center gap-2">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-white/80"
                style={{
                  animation: `pulse-bar 1.2s infinite ease-in-out ${i * 0.08}s`,
                  // height: `${Math.floor(Math.random() * 80) + 20}%`,
                  height: `${Math.floor(Math.sin(i * 0.5 + callDuration * 0.1) * 30) + 50}%`, // Use sin wave for stable animation
                }}
              ></div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
            <span>Recording...</span>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex h-16 w-full flex-col items-center justify-center rounded-lg text-base font-semibold transition-colors ${isMuted ? "bg-white/30 hover:bg-white/40" : "bg-white/10 hover:bg-white/20"
                }`}
            >
              <Mic size={24} />
              <span className="mt-1 text-xs">{isMuted ? "Unmuted" : "Mute"}</span>
            </button>
            <button
              onClick={onEndCall}
              className="flex h-16 w-full flex-col items-center justify-center rounded-lg bg-red-500 text-base font-semibold text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl"
            >
              <PhoneOff size={24} />
              <span className="mt-1 text-xs">End Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboardPage;