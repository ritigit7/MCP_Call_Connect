"use client";

import React, { useState, useEffect, useMemo } from "react";
import { baseURL } from "@/lib/api";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import {
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Loader,
  Mic,
  Eye,
  FileText,
  BarChart2,
  PhoneOff,
  ChevronDown,
  Search,
  X,
  Phone,
  User,
  Headphones,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Target,
  Zap,
} from "lucide-react";


type CallStatus = "Completed" | "Ongoing" | "Failed" | "Initiated";

interface Call {
  id: string;
  callId: string; // UUID used for transcription/analysis lookups
  date: string;
  time: string;
  customer: {
    name: string;
    email: string;
  };
  duration: string;
  status: CallStatus;
  hasRecording: boolean;
}

interface TranscriptSegment {
  speaker: string;
  text: string;
  start?: number; // Backend uses 'start' and 'end'
  end?: number;
  startTime?: number; // Alternative naming
  endTime?: number;
  confidence?: number;
}

interface Transcription {
  status: string;
  conversation?: TranscriptSegment[]; // Backend uses 'conversation'
  segments?: TranscriptSegment[]; // Alternative naming
  fullText?: string;
  metadata?: {
    duration: number;
    language: string;
    processedAt: string;
  };
}

interface CallAnalysis {
  _id: string;
  callId: string;
  summary: {
    brief: string;
    keyPoints: string[];
    outcome: string;
  };
  sentiment: {
    overall: string;
    customer: string;
    agent: string;
    scores: {
      overall: number;
      customer: number;
      agent: number;
    };
  };
  topics: {
    main: string;
    subTopics: string[];
    tags: string[];
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
  createdAt: string;
}

const AgentCallsPage = () => {

  const [isLoading, setIsLoading] = useState(true);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [error, setApiError] = useState<string | null>(null);

  // Modal states
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchCalls = async () => {
      setIsLoading(true);
      setApiError(null);
      try {

        const token = localStorage.getItem('agent-token');
        if (!token) {
          throw new Error("No authentication token found. Please log in again.");
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(`${baseURL}/calls/my-calls`, { headers });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch call history.");
        }

        const data = await response.json();

        // Map backend data to frontend Call type
        const formattedCalls: Call[] = data.calls.map((call: { startTime: string; duration: number; customer: { name: string; email: string; }; _id: string; callId: string; status: string; recordingUrl: string; }, index: number) => {
          const startTime = new Date(call.startTime);
          const durationInSeconds = call.duration || 0;
          const minutes = Math.floor(durationInSeconds / 60);
          const seconds = durationInSeconds % 60;

          return {
            id: call._id,
            callId: call.callId, // UUID for transcription/analysis lookups
            date: startTime.toLocaleDateString('en-CA'), // YYYY-MM-DD format
            time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            customer: {
              name: call.customer?.name || 'Unknown Customer',
              email: call.customer?.email || 'No email',
            },
            duration: `${minutes}m ${seconds}s`,
            status: (call.status.charAt(0).toUpperCase() + call.status.slice(1)) as CallStatus,
            hasRecording: !!call.recordingUrl,
          };
        });

        setFilteredCalls(formattedCalls);
      } catch (err) {
        setApiError((err as Error).message);
        setFilteredCalls([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const handleViewTranscript = (id: string) => {
    // Find the call and use its callId (UUID) for transcript lookup
    const call = filteredCalls.find(c => c.id === id);
    if (call) {
      setSelectedCallId(call.callId);
      setShowTranscriptModal(true);
    }
  };

  const handleViewAnalysis = (id: string) => {
    // Find the call and use its callId (UUID) for analysis lookup
    const call = filteredCalls.find(c => c.id === id);
    if (call) {
      setSelectedCallId(call.callId);
      setShowAnalysisModal(true);
    }
  };

  const handleViewDetails = (id: string) => {
    setSelectedCallId(id);
    setShowDetailsModal(true);
  };

  const selectedCall = filteredCalls.find(c => c.id === selectedCallId || c.callId === selectedCallId);

  return (
    <>
      <PageHeader />
      <Filters />
      <div className="mt-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="mt-8 text-center text-red-500 bg-red-50 p-6 rounded-lg">
            <p><strong>Error:</strong> {error}</p>
            <p>Could not load call history. Please try again later.</p>
          </div>
        ) : filteredCalls.length > 0 ? (
          <CallsTable
            calls={filteredCalls}
            onViewTranscript={handleViewTranscript}
            onViewAnalysis={handleViewAnalysis}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <EmptyState />
        )}
      </div>
      {!isLoading && filteredCalls.length > 0 && <Pagination />}

      {/* Transcript Modal */}
      {showTranscriptModal && selectedCallId && (
        <TranscriptModal
          callId={selectedCallId}
          customerName={selectedCall?.customer.name || 'Customer'}
          onClose={() => setShowTranscriptModal(false)}
        />
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && selectedCallId && (
        <AnalysisModal
          callId={selectedCallId}
          customerName={selectedCall?.customer.name || 'Customer'}
          onClose={() => setShowAnalysisModal(false)}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCall && (
        <DetailsModal
          call={selectedCall}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
};

const PageHeader = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-800">Call History</h1>
    <p className="mt-1 text-gray-500">View and manage all your calls</p>
  </div>
);

const Filters = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Date Range */}
        <div className="md:col-span-3">
          <button className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-gray-700 hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>Last 30 Days</span>
            </div>
            <ChevronDown size={18} />
          </button>
        </div>
        {/* Status Filter */}
        <div className="md:col-span-3">
          <button className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-gray-700 hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} />
              <span>All Status</span>
            </div>
            <ChevronDown size={18} />
          </button>
        </div>
        {/* Search Box */}
        <div className="md:col-span-4">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {searchTerm && <X size={18} onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600" />}
          </div>
        </div>
        {/* Export Button */}
        <div className="md:col-span-2">
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-indigo-600 text-indigo-600 transition-colors hover:bg-indigo-50">
            <Download size={18} />
            <span className="font-semibold">Export CSV</span>
          </button>
        </div>
      </div>
      {/* Applied Filters */}
      <div className="mt-4 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700">
          Last 30 Days <X size={14} className="cursor-pointer" />
        </span>
        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700">
          Completed <X size={14} className="cursor-pointer" />
        </span>
        <button className="text-sm font-semibold text-indigo-600 hover:underline">Clear All</button>
      </div>
    </div>
  );
};

interface CallsTableProps {
  calls: Call[];
  onViewTranscript: (callId: string) => void;
  onViewAnalysis: (callId: string) => void;
  onViewDetails: (callId: string) => void;
}

const CallsTable = ({ calls, onViewTranscript, onViewAnalysis, onViewDetails }: CallsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo<ColumnDef<Call>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date & Time",
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium text-gray-800">{row.original.date}</div>
            <div className="text-sm text-gray-500">{row.original.time}</div>
          </div>
        ),
      },
      {
        accessorKey: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-gray-200 bg-indigo-100 flex items-center justify-center">
              <User size={24} className="text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{row.original.customer.name}</div>
              <div className="text-xs text-gray-500">{row.original.customer.email}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock size={16} />
            <span>{row.original.duration}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "hasRecording",
        header: "Recording",
        cell: ({ row }) => (
          <Mic size={20} className={row.original.hasRecording ? "text-gray-600" : "text-gray-300"} />
        ),
      },
      {
        id: "actions",
        header: "Details",
        cell: ({ row }) => (
          <ActionsMenu
            callId={row.original.id}
            onViewDetails={onViewDetails}
            onViewTranscript={onViewTranscript}
            onViewAnalysis={onViewAnalysis}
          />
        ),
      },
    ],
    [onViewDetails, onViewTranscript, onViewAnalysis]
  );

  const table = useReactTable({
    data: calls,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-visible">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="relative group transition-colors hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  No calls found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile Card List */}
      <div className="md:hidden">
        <ul className="divide-y divide-gray-200">
          {calls.map((call) => (
            <li key={call.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-2 border-gray-200 bg-indigo-100 flex items-center justify-center">
                    <User size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{call.customer.name}</p>
                    <p className="text-sm text-gray-500">
                      {call.date} at {call.time}
                    </p>
                  </div>
                </div>
                <ActionsMenu
                  callId={call.id}
                  onViewDetails={onViewDetails}
                  onViewTranscript={onViewTranscript}
                  onViewAnalysis={onViewAnalysis}
                />
              </div>
              <div className="mt-4 flex justify-between items-center">
                <StatusBadge status={call.status} />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Clock size={14} />
                    <span>{call.duration}</span>
                  </div>
                  <Mic size={18} className={call.hasRecording ? "text-gray-600" : "text-gray-300"} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: CallStatus }) => {
  const styles = {
    Completed: { icon: CheckCircle, classes: "bg-green-100 text-green-800" },
    Ongoing: { icon: Loader, classes: "bg-blue-100 text-blue-800" },
    Failed: { icon: XCircle, classes: "bg-red-100 text-red-800" },
    Initiated: { icon: Phone, classes: "bg-gray-100 text-gray-800" },
  };
  const { icon: Icon, classes } = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      <Icon size={14} className={status === 'Ongoing' ? 'animate-spin' : ''} />
      {status}
    </span>
  );
};

interface ActionsMenuProps {
  callId: string;
  onViewDetails: (callId: string) => void;
  onViewTranscript: (callId: string) => void;
  onViewAnalysis: (callId: string) => void;
}

const ActionsMenu = ({ callId, onViewDetails, onViewTranscript, onViewAnalysis }: ActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleAction = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case 'details':
        onViewDetails(callId);
        break;
      case 'transcript':
        onViewTranscript(callId);
        break;
      case 'analysis':
        onViewAnalysis(callId);
        break;
      case 'download':
        // TODO: Implement download recording
        break;
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 192, // 192px = w-48 (12rem)
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        title="Actions"
        aria-label="Call actions menu"
      >
        <MoreHorizontal size={20} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[101] w-48 rounded-lg bg-white shadow-xl ring-1 ring-black/5 border border-gray-200 divide-y divide-gray-100"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="py-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleAction('details'); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <Eye size={16} className="text-gray-400" />
                <span>View Details</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleAction('transcript'); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <FileText size={16} className="text-gray-400" />
                <span>View Transcript</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleAction('analysis'); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <BarChart2 size={16} className="text-gray-400" />
                <span>View Analysis</span>
              </button>
            </div>
            <div className="py-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleAction('download'); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download size={16} className="text-gray-400" />
                <span>Download Recording</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Pagination = () => (
  <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-gray-700 md:flex-row">
    <p>Showing <span className="font-semibold">1-5</span> of <span className="font-semibold">5</span> calls</p>
    <div className="flex items-center gap-2">
      <button className="flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50" disabled>
        <ChevronLeft size={18} />
      </button>
      <button className="flex h-9 w-9 items-center justify-center rounded-md border bg-indigo-500 text-white">1</button>
      <button className="flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-gray-50">2</button>
      <button className="flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-gray-50">3</button>
      <span className="px-2">...</span>
      <button className="flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-gray-50">8</button>
      <button className="flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-gray-50">
        <ChevronRight size={18} />
      </button>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12">
    <PhoneOff className="mx-auto h-16 w-16 text-gray-400" />
    <h3 className="mt-4 text-xl font-semibold text-gray-800">No calls found</h3>
    <p className="mt-2 text-gray-500">Try adjusting your filters to find what you&apos;re looking for.</p>
    <button className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
      Clear Filters
    </button>
  </div>
);

const LoadingSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="w-full animate-pulse">
      {/* Header */}
      <div className="h-14 bg-gray-50 border-b border-gray-200"></div>
      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-6 p-4 border-b border-gray-200">
          <div className="w-1/4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex items-center gap-3 w-1/3">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="w-1/6 h-4 bg-gray-200 rounded"></div>
          <div className="w-1/6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-1/12 h-4 bg-gray-200 rounded"></div>
          <div className="w-1/12 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Transcript Modal Component
interface TranscriptModalProps {
  callId: string;
  customerName: string;
  onClose: () => void;
}

const TranscriptModal = ({ callId, customerName, onClose }: TranscriptModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);

  useEffect(() => {
    const fetchTranscription = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('agent-token');
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${baseURL}/transcriptions/${callId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("No transcription available for this call");
            return;
          }
          throw new Error("Failed to fetch transcription");
        }

        const data = await response.json();
        setTranscription(data.transcription);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranscription();
  }, [callId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">Call Transcript</h2>
              <p className="text-sm text-white/80">Conversation with {customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="mt-4 text-gray-500">Loading transcript...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">{error}</p>
              <p className="mt-2 text-sm text-gray-400">The transcript may still be processing or unavailable.</p>
            </div>
          ) : transcription ? (
            <div className="space-y-4">
              {(() => {
                // Support both 'conversation' and 'segments' field names
                const messages = transcription.conversation || transcription.segments || [];
                
                return messages.length > 0 ? (
                  messages.map((segment, index) => {
                    // Support both 'start'/'end' and 'startTime'/'endTime'
                    const startTime = segment.start ?? segment.startTime ?? 0;
                    const endTime = segment.end ?? segment.endTime ?? 0;
                    // Normalize speaker to lowercase for comparison
                    const speakerLower = segment.speaker.toLowerCase();
                    const isAgent = speakerLower === 'agent';
                    
                    return (
                      <div
                        key={index}
                        className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isAgent
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isAgent ? <Headphones size={16} /> : <User size={16} />}
                        </div>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          isAgent
                            ? 'bg-indigo-50 text-gray-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p className="text-sm font-medium mb-1 text-xs text-gray-500">
                            {segment.speaker}
                          </p>
                          <p className="text-sm">{segment.text}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatTime(startTime)} - {formatTime(endTime)}
                            {segment.confidence && (
                              <span className="ml-2">({Math.round(segment.confidence * 100)}% confidence)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : transcription.fullText ? (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcription.fullText}</p>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No transcript content available</p>
                );
              })()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Analysis Modal Component
interface AnalysisModalProps {
  callId: string;
  customerName: string;
  onClose: () => void;
}

const AnalysisModal = ({ callId, customerName, onClose }: AnalysisModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('agent-token');
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${baseURL}/analysis/${callId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("No analysis available for this call");
            return;
          }
          throw new Error("Failed to fetch analysis");
        }

        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [callId]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">Call Analysis</h2>
              <p className="text-sm text-white/80">AI-powered insights for call with {customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-purple-500" />
              <p className="mt-4 text-gray-500">Loading analysis...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">{error}</p>
              <p className="mt-2 text-sm text-gray-400">The analysis may still be processing or unavailable.</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                  <MessageSquare size={18} className="text-purple-500" />
                  Summary
                </h3>
                <p className="mt-2 text-sm text-gray-600">{analysis.summary?.brief || 'No summary available'}</p>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Sentiment */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-500">Overall Sentiment</h4>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getSentimentColor(analysis.sentiment?.overall)}`}>
                      {analysis.sentiment?.overall || 'N/A'}
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {analysis.sentiment?.scores?.overall ? `${Math.round(analysis.sentiment.scores.overall * 100)}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* Agent Performance */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-500">Agent Performance</h4>
                  <div className="mt-2 flex items-center gap-2">
                    <Target size={20} className="text-indigo-500" />
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.agentPerformance?.scores?.overall || 0)}`}>
                      {analysis.agentPerformance?.scores?.overall || '—'}
                    </span>
                    <span className="text-gray-400">/ 10</span>
                  </div>
                </div>

                {/* Customer Experience */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-500">Customer Experience</h4>
                  <div className="mt-2 flex items-center gap-2">
                    {analysis.customerExperience?.effortLevel === 'easy' ? (
                      <ThumbsUp size={20} className="text-green-500" />
                    ) : (
                      <ThumbsDown size={20} className="text-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {analysis.customerExperience?.effortLevel || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Topics */}
              {analysis.topics && (analysis.topics.tags?.length > 0 || analysis.topics.main) && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                    <Zap size={18} className="text-yellow-500" />
                    Topics Discussed
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.topics.main && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                        {analysis.topics.main}
                      </span>
                    )}
                    {analysis.topics.tags?.map((tag: string, index: number) => (
                      <span key={index} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Points */}
              {analysis.summary?.keyPoints && analysis.summary.keyPoints.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                    <TrendingUp size={18} className="text-blue-500" />
                    Key Points
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {analysis.summary.keyPoints.map((point: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {analysis.actionItems?.promisesMade && analysis.actionItems.promisesMade.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-orange-800">
                    <AlertCircle size={18} />
                    Action Items / Promises Made
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {analysis.actionItems.promisesMade.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                        <span className="mt-0.5 h-5 w-5 shrink-0 rounded border border-orange-300 bg-white"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agent Strengths & Improvements */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {analysis.agentPerformance?.strengths && analysis.agentPerformance.strengths.length > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h3 className="flex items-center gap-2 font-semibold text-green-800">
                      <ThumbsUp size={18} />
                      Strengths
                    </h3>
                    <ul className="mt-3 space-y-1">
                      {analysis.agentPerformance.strengths.map((strength: string, index: number) => (
                        <li key={index} className="text-sm text-green-700">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.agentPerformance?.areasForImprovement && analysis.agentPerformance.areasForImprovement.length > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <h3 className="flex items-center gap-2 font-semibold text-yellow-800">
                      <TrendingUp size={18} />
                      Areas for Improvement
                    </h3>
                    <ul className="mt-3 space-y-1">
                      {analysis.agentPerformance.areasForImprovement.map((improvement: string, index: number) => (
                        <li key={index} className="text-sm text-yellow-700">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Issue Status */}
              {analysis.issues && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800">Issue Resolution</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                      analysis.issues.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : analysis.issues.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {analysis.issues.status}
                    </span>
                    {analysis.issues.primary && (
                      <span className="text-sm text-gray-600">{analysis.issues.primary}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Details Modal Component
interface DetailsModalProps {
  call: Call;
  onClose: () => void;
}

const DetailsModal = ({ call, onClose }: DetailsModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Call Details</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Customer Info */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{call.customer.name}</h3>
              <p className="text-sm text-gray-500">{call.customer.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Date</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{call.date}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Time</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{call.time}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Duration</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{call.duration}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Status</p>
              <div className="mt-1">
                <StatusBadge status={call.status} />
              </div>
            </div>
          </div>

          {/* Recording Status */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Mic size={20} className={call.hasRecording ? 'text-green-500' : 'text-gray-300'} />
              <span className="text-sm text-gray-600">
                {call.hasRecording ? 'Recording available' : 'No recording available'}
              </span>
            </div>
          </div>

          {/* Call ID */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase">Call ID</p>
            <p className="mt-1 text-xs font-mono text-gray-500 break-all">{call.id}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentCallsPage;