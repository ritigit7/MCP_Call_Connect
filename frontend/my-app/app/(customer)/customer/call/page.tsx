"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { baseURL } from "@/lib/api";
import { useSocket } from "@/lib/socket-context";
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
  const [customerName, setCustomerName] = useState("Customer");
  const [customerId, setCustomerId] = useState<string | null>(null);

  const { socket, isConnected } = useSocket();
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentCallId = useRef<string | null>(null);

  // Load customer info
  useEffect(() => {
    const userData = localStorage.getItem("customer");
    if (userData) {
      const customer = JSON.parse(userData);
      setCustomerName(customer.name || "Customer");
      setCustomerId(customer.id);
    } else {
      // Auto-register if no customer found (for demo purposes)
      const autoRegister = async () => {
        try {
          const randomId = Math.floor(Math.random() * 10000);
          const res = await fetch(`${baseURL}/customers/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `Customer ${randomId}`,
              email: `customer${randomId}@example.com`,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            localStorage.setItem("customer", JSON.stringify(data.customer));
            setCustomerName(data.customer.name);
            setCustomerId(data.customer.id);
          }
        } catch (err) {
          console.error("Auto-registration failed", err);
        }
      };
      autoRegister();
    }
  }, []);

  // Socket: Join as customer
  useEffect(() => {
    if (socket && isConnected && customerId) {
      socket.emit("customer:join", { customerId });
    }
  }, [socket, isConnected, customerId]);

  // Handle socket errors (e.g., customer not found)
  useEffect(() => {
    if (!socket) return;

    const onError = (error: { message: string }) => {
      console.error('Socket error:', error.message);
      // If customer not found, clear localStorage and re-register
      if (error.message.includes('Customer not found')) {
        console.log('Customer not found in database, re-registering...');
        localStorage.removeItem('customer');
        setCustomerId(null);
        setCallState('idle');
        // Trigger re-registration
        window.location.reload();
      }
    };

    socket.on('error', onError);
    return () => {
      socket.off('error', onError);
    };
  }, [socket]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === "active") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const setupWebRTC = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && currentCallId.current) {
          socket.emit("webrtc:ice-candidate", {
            callId: currentCallId.current,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current = pc;
    } catch (err) {
      console.error("Error setting up WebRTC:", err);
      setApiError("Could not access microphone");
      setCallState("idle");
    }
  }, [socket]);

  const createOffer = useCallback(async () => {
    if (!peerConnection.current || !socket || !currentCallId.current) return;

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("webrtc:offer", {
        callId: currentCallId.current,
        offer,
      });
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  }, [socket]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;
    try {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (err) {
      console.error("Error handling answer:", err);
    }
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedStreamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    try {
      recordedChunksRef.current = [];

      // Initialize AudioContext
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const mixedStreamDestination = audioContext.createMediaStreamDestination();
      mixedStreamDestinationRef.current = mixedStreamDestination;

      // Mix Local Stream
      if (localStream.current) {
        const localSource = audioContext.createMediaStreamSource(localStream.current);
        localSource.connect(mixedStreamDestination);
      }

      // Mix Remote Stream
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
        // Create a new stream from the remote audio element or track to avoid issues
        const remoteStream = remoteAudioRef.current.srcObject as MediaStream;
        if (remoteStream.getAudioTracks().length > 0) {
          const remoteSource = audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(mixedStreamDestination);
        }
      }

      const combinedStream = mixedStreamDestination.stream;

      let options: MediaRecorderOptions = { mimeType: 'audio/webm' };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      }

      const recorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        console.log("Recording started");
      };

      recorder.start(1000); // Collect 1s chunks

    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve();
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            if (socket && currentCallId.current) {
              socket.emit('recording:complete', {
                callId: currentCallId.current,
                audioBlob: base64data,
                format: 'webm'
              });
              console.log("Recording uploaded");
            }
            resolve();
          };
          reader.readAsDataURL(blob);
        } else {
          resolve();
        }
      };

      recorder.stop();

      // Cleanup AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    });
  }, [socket, currentCallId]);

  const cleanupCall = useCallback(async () => {
    await stopRecording();

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    currentCallId.current = null;
    setCallState("idle");
    setSelectedAgent(null);
    setCallDuration(0);
  }, [stopRecording, setCallState, setSelectedAgent, setCallDuration]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const onCallAccepted = async (data: { callId: string }) => {
      console.log("Call accepted:", data);
      setCallState("active");
      await setupWebRTC();
      await createOffer();
      // Start recording after a short delay to ensure streams are ready
      setTimeout(() => startRecording(), 1000);
    };

    const onCallEnded = () => {
      console.log("Call ended by agent");
      cleanupCall();
    };

    const onWebRTCAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      await handleAnswer(data.answer);
    };

    const onICECandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      if (peerConnection.current && data.candidate) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      }
    };

    socket.on("call:accepted", onCallAccepted);
    socket.on("call:ended", onCallEnded);
    socket.on("webrtc:answer", onWebRTCAnswer);
    socket.on("webrtc:ice-candidate", onICECandidate);

    return () => {
      socket.off("call:accepted", onCallAccepted);
      socket.off("call:ended", onCallEnded);
      socket.off("webrtc:answer", onWebRTCAnswer);
      socket.off("webrtc:ice-candidate", onICECandidate);
    };
  }, [socket, setupWebRTC, createOffer, handleAnswer, cleanupCall, startRecording]);

  const handleInitiateCall = (agent: Agent) => {
    if (agent.status !== "Online" || !socket || !customerId) return;
    setSelectedAgent(agent);
    setCallState("connecting");

    console.log('Initiating call with:', { customerId, agentId: agent.id });
    socket.emit("call:initiate", {
      customerId,
      agentId: agent.id,
    });

    // Listen for call:initiated to get callId
    socket.once("call:initiated", (data: { callId: string }) => {
      currentCallId.current = data.callId;
    });
  };

  const handleEndCall = () => {
    if (socket && currentCallId.current) {
      socket.emit("call:end", { callId: currentCallId.current });
    }
    cleanupCall();
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
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
        const formattedAgents: Agent[] = data.agents.map(
          (agent: BackendAgent, index: number) => ({
            id: agent._id,
            name: agent.name,
            status: (agent.status.charAt(0).toUpperCase() +
              agent.status.slice(1).toLowerCase()) as AgentStatus,
          })
        );

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
      <p className="mt-2 text-gray-500">
        Select an available agent to start a call.
      </p>
      {isLoading ? (
        <div className="mt-8 flex justify-center items-center h-40">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="mt-8 text-center text-red-500 bg-red-50 p-4 rounded-lg">
          <p>
            <strong>Error:</strong> {error}
          </p>
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
      <audio ref={remoteAudioRef} autoPlay />
      <main className="min-h-screen bg-[#F5F7FA] font-sans">
        {/* Header Bar */}
        <header className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <User className="h-10 w-10 rounded-full bg-gray-100 p-2 text-gray-500" />
              <div>
                <p className="font-semibold text-gray-800">{customerName}</p>
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