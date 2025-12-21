"use client";

import { useState, useEffect } from "react";
import { baseURL } from "@/lib/api";
import {
    Clock,
    Calendar,
    CheckCircle,
    XCircle,
    Loader,
    Phone,
    PhoneOff,
    User,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    X,
    FileText,
    Play,
    Headphones,
    AlertCircle,
} from "lucide-react";

type CallStatus = "completed" | "ongoing" | "failed" | "initiated";

interface CallRecord {
    _id: string;
    startTime: string;
    endTime?: string;
    duration: number;
    status: CallStatus;
    agent: {
        _id: string;
        name: string;
        email: string;
    };
    recordingUrl?: string;
    hasTranscription?: boolean;
}

interface TranscriptSegment {
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
}

interface Transcription {
    segments: TranscriptSegment[];
    fullText: string;
}

export default function CustomerHistoryPage() {
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [showTranscriptModal, setShowTranscriptModal] = useState(false);
    const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<Transcription | null>(null);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const [transcriptError, setTranscriptError] = useState<string | null>(null);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchCallHistory();
    }, []);

    const fetchCallHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const customerData = localStorage.getItem("customer");
            if (!customerData) {
                throw new Error("No customer data found. Please register first.");
            }

            const customer = JSON.parse(customerData);
            const customerId = customer._id || customer.id;

            if (!customerId) {
                throw new Error("Customer ID not found. Please register again.");
            }

            const response = await fetch(`${baseURL}/calls/customer/${customerId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setCalls([]);
                    return;
                }
                throw new Error("Failed to fetch call history");
            }

            const data = await response.json();
            setCalls(data.calls || []);
        } catch (err) {
            setError((err as Error).message);
            setCalls([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTranscription = async (callId: string) => {
        setTranscriptLoading(true);
        setTranscriptError(null);
        try {
            const response = await fetch(`${baseURL}/transcriptions/${callId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setTranscriptError("No transcription available for this call");
                    return;
                }
                throw new Error("Failed to fetch transcription");
            }

            const data = await response.json();
            setTranscription(data.transcription);
        } catch (err) {
            setTranscriptError((err as Error).message);
        } finally {
            setTranscriptLoading(false);
        }
    };

    const handleViewTranscript = (callId: string) => {
        setSelectedCallId(callId);
        setShowTranscriptModal(true);
        fetchTranscription(callId);
    };

    const closeTranscriptModal = () => {
        setShowTranscriptModal(false);
        setSelectedCallId(null);
        setTranscription(null);
        setTranscriptError(null);
    };

    // Filter calls based on search and status
    const filteredCalls = calls.filter((call) => {
        const matchesSearch = call.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || call.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
    const paginatedCalls = filteredCalls.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getStatusBadge = (status: CallStatus) => {
        const styles = {
            completed: { icon: CheckCircle, classes: "bg-green-100 text-green-800" },
            ongoing: { icon: Loader, classes: "bg-blue-100 text-blue-800" },
            failed: { icon: XCircle, classes: "bg-red-100 text-red-800" },
            initiated: { icon: Phone, classes: "bg-gray-100 text-gray-800" },
        };
        const { icon: Icon, classes } = styles[status] || styles.initiated;
        return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
                <Icon size={14} className={status === "ongoing" ? "animate-spin" : ""} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatTranscriptTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-800">Call History</h1>
                <p className="mt-1 text-gray-500">View all your previous calls and conversations</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by agent name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {searchTerm && (
                            <X
                                size={18}
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                            />
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="failed">Failed</option>
                            <option value="initiated">Initiated</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Call List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader className="h-10 w-10 animate-spin text-indigo-500" />
                        <p className="mt-4 text-gray-500">Loading call history...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle className="h-12 w-12 text-red-400" />
                        <p className="mt-4 text-red-600 font-medium">{error}</p>
                        <button
                            onClick={fetchCallHistory}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredCalls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <PhoneOff className="h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-700">No calls found</h3>
                        <p className="mt-2 text-gray-500">
                            {searchTerm || statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "You haven't made any calls yet"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Date & Time
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Agent
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Duration
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedCalls.map((call) => (
                                        <tr key={call._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-800">
                                                            {formatDate(call.startTime)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {formatTime(call.startTime)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-800">
                                                            {call.agent?.name || "Unknown Agent"}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {call.agent?.email || ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Clock size={16} />
                                                    <span>{formatDuration(call.duration || 0)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(call.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {call.recordingUrl && (
                                                        <button
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                                                            onClick={() => window.open(call.recordingUrl, "_blank")}
                                                        >
                                                            <Play size={14} />
                                                            Play
                                                        </button>
                                                    )}
                                                    <button
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
                                                        onClick={() => handleViewTranscript(call._id)}
                                                    >
                                                        <FileText size={14} />
                                                        Transcript
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {paginatedCalls.map((call) => (
                                <div key={call._id} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {call.agent?.name || "Unknown Agent"}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(call.startTime)} at {formatTime(call.startTime)}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(call.status)}
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock size={14} />
                                            <span>{formatDuration(call.duration || 0)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {call.recordingUrl && (
                                                <button
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg"
                                                    onClick={() => window.open(call.recordingUrl, "_blank")}
                                                >
                                                    <Play size={14} />
                                                </button>
                                            )}
                                            <button
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg"
                                                onClick={() => handleViewTranscript(call._id)}
                                            >
                                                <FileText size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    Showing{" "}
                                    <span className="font-medium">
                                        {(currentPage - 1) * itemsPerPage + 1}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, filteredCalls.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{filteredCalls.length}</span> calls
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium ${
                                                    currentPage === pageNum
                                                        ? "bg-indigo-500 text-white border-indigo-500"
                                                        : "bg-white hover:bg-gray-50"
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Transcript Modal */}
            {showTranscriptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-white" />
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Call Transcript</h2>
                                    <p className="text-sm text-white/80">View the conversation details</p>
                                </div>
                            </div>
                            <button
                                onClick={closeTranscriptModal}
                                className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(80vh - 80px)" }}>
                            {transcriptLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader className="h-8 w-8 animate-spin text-indigo-500" />
                                    <p className="mt-4 text-gray-500">Loading transcript...</p>
                                </div>
                            ) : transcriptError ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <AlertCircle className="h-12 w-12 text-gray-400" />
                                    <p className="mt-4 text-gray-600">{transcriptError}</p>
                                    <p className="mt-2 text-sm text-gray-400">
                                        The transcript may still be processing or unavailable.
                                    </p>
                                </div>
                            ) : transcription ? (
                                <div className="space-y-4">
                                    {transcription.segments && transcription.segments.length > 0 ? (
                                        transcription.segments.map((segment, index) => (
                                            <div
                                                key={index}
                                                className={`flex gap-3 ${
                                                    segment.speaker === "agent" ? "flex-row-reverse" : ""
                                                }`}
                                            >
                                                <div
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                        segment.speaker === "agent"
                                                            ? "bg-indigo-100 text-indigo-600"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {segment.speaker === "agent" ? (
                                                        <Headphones size={16} />
                                                    ) : (
                                                        <User size={16} />
                                                    )}
                                                </div>
                                                <div
                                                    className={`max-w-[80%] rounded-lg p-3 ${
                                                        segment.speaker === "agent"
                                                            ? "bg-indigo-50 text-gray-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    <p className="text-sm">{segment.text}</p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {formatTranscriptTime(segment.startTime)} -{" "}
                                                        {formatTranscriptTime(segment.endTime)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : transcription.fullText ? (
                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {transcription.fullText}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500">
                                            No transcript content available
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
