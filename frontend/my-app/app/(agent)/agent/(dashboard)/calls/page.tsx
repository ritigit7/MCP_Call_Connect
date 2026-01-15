"use client";

import React, { useState, useEffect, useMemo } from "react";
import { baseURL } from "@/lib/api";
import { useRouter } from "next/navigation";
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
  FileText,
  BarChart2,
  PhoneOff,
  ChevronDown,
  Search,
  Eye,

  User,
  Phone,
  X,
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

const AgentCallsPage = () => {

  const [isLoading, setIsLoading] = useState(true);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [error, setApiError] = useState<string | null>(null);

  const router = useRouter();

  // Modal states - Removed
  // const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  // const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  // const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  // const [showDetailsModal, setShowDetailsModal] = useState(false);

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
        const formattedCalls: Call[] = data.calls.map((call: { startTime: string; duration: number; customer: { name: string; email: string; }; _id: string; callId: string; status: string; recordingUrl: string; }) => {
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
    const call = filteredCalls.find(c => c.id === id);
    if (call) {
      router.push(`/agent/calls/${call.callId}?tab=transcript`);
    }
  };

  const handleViewAnalysis = (id: string) => {
    const call = filteredCalls.find(c => c.id === id);
    if (call) {
      router.push(`/agent/calls/${call.callId}?tab=analysis`);
    }
  };

  const handleViewDetails = (id: string) => {
    const call = filteredCalls.find(c => c.id === id);
    if (call) {
        router.push(`/agent/calls/${call.callId}?tab=overview`);
    }
  };

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

// Unused Modals removed
export default AgentCallsPage;