"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Phone,
    BarChart3,
    Target,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    User,
    ChevronDown,
    PhoneIncoming,
    PhoneOff,
    Mic,
    Clock,
} from "lucide-react";
import { useSocket } from "@/lib/socket-context";

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

export default function AgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [agentName, setAgentName] = useState("Agent");
    const [agentStatus, setAgentStatus] = useState<"online" | "offline" | "busy">("online");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { socket, isConnected } = useSocket();

    // Incoming call state
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [activeCallCustomerName, setActiveCallCustomerName] = useState<string>("");

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
                        callId: currentCallId.current,
                        candidate: event.candidate
                    });
                }
            };

            peerConnection.current = pc;
        } catch (err) {
            console.error("Error setting up WebRTC:", err);
        }
    }, [socket]);

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
        setActiveCallCustomerName("");
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

    const handleAcceptCall = async () => {
        if (!incomingCall || !socket) return;
        socket.emit('call:accept', { callId: incomingCall.callId });
        setActiveCallCustomerName(incomingCall.customer?.name || "Customer");
        await setupWebRTC();
        setIsCallActive(true);
        setIncomingCall(null);
    };

    const handleRejectCall = () => {
        if (incomingCall && socket) {
            socket.emit('call:reject', { callId: incomingCall.callId });
        }
        setIncomingCall(null);
    };

    const handleEndCall = () => {
        if (socket && currentCallId.current) {
            socket.emit('call:end', { callId: currentCallId.current });
        }
        endCallCleanup();
    };

    useEffect(() => {
        // Load agent data from localStorage
        const userData = localStorage.getItem("agent");
        if (userData) {
            const agent = JSON.parse(userData);
            // Defer setState to avoid synchronous update within effect
            // This is a common pattern when initializing state from external sources
            setTimeout(() => setAgentName(agent.name || "Agent"), 0);
        }
    }, []);

    // Emit agent:join when socket connects and set up call event listeners
    useEffect(() => {
        if (!socket || !isConnected) return;

        const agentId = localStorage.getItem('agent-id');
        console.log('Socket connected, agent-id from localStorage:', agentId);
        console.log('Socket ID:', socket.id);

        if (agentId) {
            console.log('Agent joining socket room with ID:', agentId);
            socket.emit('agent:join', { agentId });

            // Listen for confirmation that agent joined
            socket.once('agent:joined', (data) => {
                console.log('Agent joined confirmation:', data);
            });
        } else {
            console.warn('No agent-id found in localStorage! Agent will not receive calls.');
        }

        // Socket event handlers for incoming calls
        const onIncomingCall = (data: IncomingCallData) => {
            console.log('🔔 Incoming call received:', data);
            console.log('Setting incoming call state...');
            setIncomingCall(data);
            currentCallId.current = data.callId;
            console.log('Incoming call state set, popup should appear');
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

    const navigation = [
        {
            name: "Dashboard",
            href: "/agent/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Call History",
            href: "/agent/calls",
            icon: Phone,
        },
        {
            name: "Analytics",
            href: "/agent/analytics",
            icon: BarChart3,
        },
        {
            name: "Performance",
            href: "/agent/performance",
            icon: Target,
        },
        {
            name: "Settings",
            href: "/agent/settings",
            icon: Settings,
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("agent");
        localStorage.removeItem("agentToken");
        router.push("/agent/login");
    };

    const toggleStatus = () => {
        const statuses: Array<"online" | "offline" | "busy"> = ["online", "busy", "offline"];
        const currentIndex = statuses.indexOf(agentStatus);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        setAgentStatus(nextStatus);
    };

    const getStatusColor = () => {
        switch (agentStatus) {
            case "online":
                return "bg-green-500";
            case "busy":
                return "bg-yellow-500";
            case "offline":
                return "bg-red-500";
        }
    };

    const getStatusText = () => {
        return agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar - Desktop */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 ${sidebarOpen ? "w-64" : "w-20"}`}
            >
                <div className="h-full flex flex-col bg-gray-900 text-white">
                    {/* Logo Section */}
                    <div className="h-20 flex items-center justify-between px-4 border-b border-gray-800">
                        {sidebarOpen && (
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <span className="text-xl font-bold">Call Center</span>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-800 transition-colors lg:block hidden"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Agent Info Section */}
                    <div className="px-4 py-6 border-b border-gray-800">
                        {sidebarOpen ? (
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div
                                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor()} rounded-full border-2 border-gray-900`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{agentName}</p>
                                    <button
                                        onClick={toggleStatus}
                                        className="text-xs text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
                                    >
                                        <span>{getStatusText()}</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div
                                        className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-gray-900`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${isActive
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                        }`}
                                    title={!sidebarOpen ? item.name : undefined}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    {sidebarOpen && (
                                        <span className="font-medium">{item.name}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="px-3 py-6 border-t border-gray-800">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                            title={!sidebarOpen ? "Logout" : undefined}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span className="font-medium">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <div
                className={`transition-all ${sidebarOpen ? "lg:pl-64" : "lg:pl-20"
                    }`}
            >
                {/* Top Header Bar */}
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl mx-auto hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search calls, customers..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Bell className="w-6 h-6 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-600 hidden md:block" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <Link
                                        href="/agent/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {isCallActive ? (
                        <ActiveCallView onEndCall={handleEndCall} customerName={activeCallCustomerName} />
                    ) : (
                        children
                    )}
                </main>
            </div>

            {/* Remote Audio Element */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Incoming Call Modal */}
            {incomingCall && !isCallActive && (
                <IncomingCallModal
                    onAccept={handleAcceptCall}
                    onReject={handleRejectCall}
                    customerName={incomingCall?.customer?.name || "Unknown Customer"}
                    customerEmail={incomingCall?.customer?.email || "No email"}
                />
            )}
        </div>
    );
}

// Incoming Call Modal Component
const IncomingCallModal = ({
    onAccept,
    onReject,
    customerName,
    customerEmail
}: {
    onAccept: () => void;
    onReject: () => void;
    customerName: string;
    customerEmail: string;
}) => {
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
                    Incoming Call <PhoneIncoming className="animate-bounce" />
                </h2>
                <div className="mt-6 flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full border-4 border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">{customerName}</p>
                    <p className="text-base text-gray-500">{customerEmail}</p>
                </div>
                <div className="mt-8 flex justify-center gap-4">
                    <button
                        onClick={onAccept}
                        className="flex h-14 w-[140px] items-center justify-center gap-2 rounded-lg bg-green-500 text-lg font-bold text-white transition hover:bg-green-600"
                    >
                        <Phone className="w-5 h-5" />
                        Accept
                    </button>
                    <button
                        onClick={onReject}
                        className="flex h-14 w-[140px] items-center justify-center gap-2 rounded-lg bg-red-500 text-lg font-bold text-white transition hover:bg-red-600"
                    >
                        <PhoneOff className="w-5 h-5" />
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

// Active Call View Component
const ActiveCallView = ({
    onEndCall,
    customerName
}: {
    onEndCall: () => void;
    customerName?: string;
}) => {
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
        <div className="w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white shadow-2xl">
            <style jsx>{`
                @keyframes pulse-bar {
                    0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
                    50% { transform: scaleY(1); opacity: 1; }
                }
            `}</style>
            <div className="flex flex-col items-center">
                {/* Customer Info */}
                <div className="h-24 w-24 rounded-full border-4 border-white/50 bg-white/20 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="mt-4 text-3xl font-bold">{customerName || "Customer"}</h2>
                <p className="text-lg text-white/80">Active Call</p>

                {/* Call Duration */}
                <div className="mt-6 flex items-center justify-center gap-3 text-5xl font-mono tracking-widest">
                    <Clock className="h-10 w-10" />
                    <span>{formatDuration(callDuration)}</span>
                </div>

                {/* Audio Visualizer */}
                <div className="my-8 flex h-16 items-center justify-center gap-2">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1.5 rounded-full bg-white/80"
                            style={{
                                animation: `pulse-bar 1.2s infinite ease-in-out ${i * 0.08}s`,
                                height: `${Math.floor(Math.sin(i * 0.5 + callDuration * 0.1) * 30) + 50}%`,
                            }}
                        ></div>
                    ))}
                </div>

                {/* Recording Indicator */}
                <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
                    <span>Recording...</span>
                </div>

                {/* Controls */}
                <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm w-full">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`flex h-16 w-full flex-col items-center justify-center rounded-lg text-base font-semibold transition-colors ${isMuted ? "bg-white/30 hover:bg-white/40" : "bg-white/10 hover:bg-white/20"}`}
                    >
                        <Mic className="w-6 h-6" />
                        <span className="mt-1 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
                    </button>
                    <button
                        onClick={onEndCall}
                        className="flex h-16 w-full flex-col items-center justify-center rounded-lg bg-red-500 text-base font-semibold text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl"
                    >
                        <PhoneOff className="w-6 h-6" />
                        <span className="mt-1 text-xs">End Call</span>
                    </button>
                </div>
            </div>
        </div>
    );
};