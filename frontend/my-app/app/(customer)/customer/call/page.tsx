"use client";

import React, { useState, useEffect } from "react";
import { baseURL } from "@/lib/api";
import {
  User,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Loader2,
  Clock,
} from "lucide-react";

type AgentStatus = "Online" | "Busy" | "Offline";

interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
}

const CustomerCallPage = () => {
  const [callState, setCallState] = useState<"idle" | "connecting" | "active">(
    "idle"
  );
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setApiError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === "active") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000
      );
    }
    return () => clearInterval(timer);
  }, [callState]);

  const handleInitiateCall = (agent: Agent) => {
    if (agent.status !== "Online") return;
    setSelectedAgent(agent);
    setCallState("connecting");
    // Simulate connection time
    setTimeout(() => {
      setCallState("active");
    }, 3000);
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        // Assuming the API is served from the same origin,
        // you might need to adjust the URL and add a prefix like /api
        const response = await fetch(`${baseURL}/agents/all`);
        if (!response.ok) {
          throw new Error("Failed to fetch agents");
        }
        const data = await response.json();
        interface BackendAgent {
          _id: string;
          name: string;
          status: string;
        }
        // Map backend data to frontend Agent type
        const formattedAgents: Agent[] = data.agents.map((agent: BackendAgent, index: number) => ({
          id: agent._id,
          name: agent.name,
          // Your API doesn't provide an avatar, so we'll generate one.
          avatar: `/avatars/${(index % 6) + 1}.png`,
          status: (agent.status.charAt(0).toUpperCase() + agent.status.slice(1).toLowerCase()) as AgentStatus,
        }));

        setAgents(formattedAgents);
        setApiError(null);
      } catch (error) {
        setApiError((error as Error).message);
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleEndCall = () => {
    setCallState("idle");
    setSelectedAgent(null);
    setCallDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const StatusBadge = ({ status }: { status: AgentStatus }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-medium rounded-full";
    if (status === "Online") {
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>
          Online
        </span>
      );
    }
    if (status === "Busy") {
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
          Busy
        </span>
      );
    }
    return (
      <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
        Offline
      </span>
    );
  };

  const AgentCard = ({ agent }: { agent: Agent }) => {
    const isOnline = agent.status === "Online";
    const isConnectingToThisAgent =
      callState === "connecting" && selectedAgent?.id === agent.id;

    return (
      <div
        className={`relative overflow-hidden rounded-lg border bg-white p-6 text-center shadow-sm transition-all duration-300 ${isOnline
          ? "border-gray-200 hover:shadow-lg hover:-translate-y-1"
          : "border-gray-200 bg-gray-50 filter grayscale"
          } ${isConnectingToThisAgent
            ? "ring-4 ring-indigo-400 ring-offset-2 animate-pulse"
            : ""
          } ${isOnline && "hover:ring-2 hover:ring-green-400"}`}
      >
        {isOnline && (
          <div className="absolute top-0 right-0 h-3 w-3 rounded-bl-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
        )}
        <User className="mx-auto h-18 w-18 rounded-full bg-gray-100 p-4 text-gray-400" />
        <h3 className="mt-4 text-lg font-bold text-gray-800">{agent.name}</h3>
        <div className="mt-2">
          <StatusBadge status={agent.status} />
        </div>
        <button
          onClick={() => handleInitiateCall(agent)}
          disabled={!isOnline || callState !== "idle"}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-70"
        >
          {isConnectingToThisAgent ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Phone className="h-5 w-5" />
              Call Agent
            </>
          )}
        </button>
      </div>
    );
  };

  const AgentSelection = () => (
    <div className="w-full max-w-5xl rounded-xl bg-white p-8 shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800">Choose Your Agent</h2>
      <p className="mt-2 text-gray-500">Select an available agent to start a call.</p>
      {isLoading ? (
        <div className="mt-8 flex justify-center items-center h-40">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="mt-8 text-center text-red-500 bg-red-50 p-4 rounded-lg">
          <p><strong>Error:</strong> {error}</p>
          <p>Could not load agent information. Please try again later.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
        </div>
      )}
    </div>
  );

  const ActiveCall = () => (
    <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 p-8 text-white shadow-2xl">
      <div className="text-center">
        <User className="mx-auto h-32 w-32 rounded-full border-4 border-white/50 bg-white/20 p-6 text-white" />
        <h2 className="mt-4 text-3xl font-bold">{selectedAgent?.name}</h2>
        <p className="text-lg text-white/80">Professional Agent</p>
      </div>

      <div className="my-8 flex items-center justify-center gap-3 text-6xl font-mono tracking-widest">
        <Clock className="h-12 w-12" />
        <span>{formatDuration(callDuration)}</span>
      </div>

      <div className="my-8 flex h-16 items-center justify-center gap-2">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-2 rounded-full bg-white/80"
            style={{
              animation: `pulse-bar 1.2s infinite ease-in-out ${i * 0.1}s`,
              height: `${Math.floor(Math.random() * 60) + 20}%`,
            }}
          ></div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm">
        <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
        <span>Recording...</span>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`flex h-16 w-full flex-col items-center justify-center rounded-lg text-base font-semibold transition-colors ${isMuted
            ? "bg-white/30 hover:bg-white/40"
            : "bg-white/10 hover:bg-white/20"
            }`}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
          <span className="mt-1 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
        </button>
        <button
          onClick={handleEndCall}
          className="flex h-16 w-full flex-col items-center justify-center rounded-lg bg-red-500 text-base font-semibold text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl"
        >
          <PhoneOff className="h-6 w-6" />
          <span className="mt-1 text-xs">End Call</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-bar {
          0%,
          100% {
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
      <main className="min-h-screen bg-[#F5F7FA] font-sans">
        {/* Header Bar */}
        <header className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <User className="h-10 w-10 rounded-full bg-gray-100 p-2 text-gray-500" />
              <div>
                <p className="font-semibold text-gray-800">John Doe</p>
                <p className="text-xs text-gray-500">Customer</p>
              </div>
            </div>
            <h1 className="hidden text-xl font-bold text-gray-800 md:block">
              Connect with an Agent
            </h1>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full transition-colors ${callState === "active" ? "bg-green-500" : "bg-red-500"
                  }`}
              ></div>
              <span className="text-sm font-medium text-gray-600">
                {callState === "active" ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex min-h-[calc(100vh-70px)] items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="transition-all duration-500 ease-in-out">
            {callState === "idle" || callState === "connecting" ? (
              <AgentSelection />
            ) : (
              <ActiveCall />
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default CustomerCallPage;