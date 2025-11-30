"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Plus, MoreVertical, X, CheckCircle,
    Star, TrendingUp, TrendingDown, Loader2
} from 'lucide-react';
import {
    useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
    ColumnDef, SortingState,
} from '@tanstack/react-table';
import { baseURL } from "@/lib/api";
import { useRouter } from 'next/navigation';

// --- TYPES ---
type AgentStatus = 'Online' | 'Offline' | 'Busy';
type Agent = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    status: AgentStatus;
    calls: {
        total: number;
        trend: 'up' | 'down' | 'stable';
    };
    score: number;
    isActive: boolean;
};

// --- HELPER COMPONENTS & FUNCTIONS ---

const StatusIndicator = ({ status }: { status: AgentStatus }) => {
    const baseClasses = "w-3 h-3 rounded-full relative";
    const pulseClasses = "absolute inset-0 rounded-full animate-pulse";

    const statusConfig = {
        Online: { color: 'bg-green-500', pulseColor: 'bg-green-400' },
        Offline: { color: 'bg-red-500', pulseColor: 'bg-red-400' },
        Busy: { color: 'bg-yellow-500', pulseColor: 'bg-yellow-400' },
    };

    const config = statusConfig[status] || statusConfig.Offline;
    const { color, pulseColor } = config;

    return (
        <div className="flex items-center gap-2">
            <div className={baseClasses}>
                <span className={`${baseClasses} ${color}`}></span>
                {status === 'Online' && <span className={`${pulseClasses} ${pulseColor}`}></span>}
            </div>
            <span className="text-gray-300">{status}</span>
        </div>
    );
};

const ScoreDisplay = ({ score }: { score: number }) => {
    let colorClass = 'text-red-500';
    if (score >= 9) colorClass = 'text-yellow-400';
    else if (score >= 8) colorClass = 'text-green-500';
    else if (score >= 7) colorClass = 'text-yellow-600';

    return (
        <div className="flex items-center gap-1.5">
            <Star className={`w-4 h-4 ${colorClass}`} fill="currentColor" />
            <span className={`font-bold ${colorClass}`}>{score ? score.toFixed(1) : 'N/A'}</span>
        </div>
    );
};

const AgentManagementPage = () => {
    const router = useRouter();
    const [data, setData] = useState<Agent[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const token = localStorage.getItem("superAdminToken");
                if (!token) {
                    router.push('/superadmin/login');
                    return;
                }

                const response = await fetch(`${baseURL}/superadmin/agents`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch agents');
                }

                const responseData = await response.json();

                // Map backend data to frontend Agent type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedAgents: Agent[] = responseData.agents.map((agent: any) => ({
                    id: agent._id,
                    name: agent.name,
                    email: agent.email,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random`,
                    status: (agent.status.charAt(0).toUpperCase() + agent.status.slice(1)) as AgentStatus,
                    calls: {
                        total: agent.totalCalls || 0,
                        trend: 'stable' // Backend doesn't provide trend yet
                    },
                    score: agent.avgPerformanceScore || 0,
                    isActive: agent.isActive
                }));

                setData(mappedAgents);
            } catch (err) {
                console.error("Error fetching agents:", err);
                setError("Failed to load agents. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAgents();
    }, [router]);

    const columns = useMemo<ColumnDef<Agent>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <input type="checkbox" className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
                        {...{
                            checked: table.getIsAllRowsSelected(),
                            onChange: table.getToggleAllRowsSelectedHandler(),
                        }}
                    />
                ),
                cell: ({ row }) => (
                    <input type="checkbox" className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
                        {...{
                            checked: row.getIsSelected(),
                            disabled: !row.getCanSelect(),
                            onChange: row.getToggleSelectedHandler(),
                        }}
                    />
                ),
            },
            { accessorKey: 'id', header: '#', cell: info => info.row.index + 1 },
            {
                accessorKey: 'name',
                header: 'Agent',
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <img src={row.original.avatar} alt={row.original.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <div className="font-bold text-white">{row.original.name}</div>
                            <div className="text-sm text-gray-400">{row.original.email}</div>
                        </div>
                    </div>
                ),
            },
            { accessorKey: 'status', header: 'Status', cell: info => <StatusIndicator status={info.getValue() as AgentStatus} /> },
            {
                accessorKey: 'calls.total',
                header: 'Calls',
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <span>{row.original.calls.total}</span>
                        {row.original.calls.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {row.original.calls.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                )
            },
            { accessorKey: 'score', header: 'Score', cell: info => <ScoreDisplay score={info.getValue() as number} /> },
            {
                accessorKey: 'isActive',
                header: 'Active',
                cell: ({ row }) => (
                    row.original.isActive
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <X className="w-5 h-5 text-red-500" />
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="relative">
                        <button className="p-2 rounded-full hover:bg-slate-700">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {/* Dropdown menu would be implemented here */}
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter, rowSelection },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (isLoading) {
        return (
            <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-red-500 text-xl mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 min-h-screen text-white p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Agent Management</h1>
                    <p className="text-slate-400 mt-1">Manage all agents and their performance</p>
                </div>
                <button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5" />
                    Create New Agent
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 bg-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(String(e.target.value))}
                            className="bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 w-64 focus:w-96 transition-all duration-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    {/* Other filters can be added here */}
                </div>
                <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-4 rounded-lg">
                    Export CSV
                </button>
            </div>

            {/* Main Content: Table */}
            <div className="bg-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-700 text-slate-300 uppercase text-sm font-semibold">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="p-4 border-b border-slate-600">
                                        {header.isPlaceholder ? null : (
                                            <div
                                                {...{
                                                    className: header.column.getCanSort()
                                                        ? 'cursor-pointer select-none flex items-center gap-2'
                                                        : '',
                                                    onClick: header.column.getToggleSortingHandler(),
                                                }}
                                            >
                                                {typeof header.column.columnDef.header === 'function'
                                                    ? header.column.columnDef.header(header.getContext())
                                                    : header.column.columnDef.header}
                                                {{
                                                    asc: ' 🔼',
                                                    desc: ' 🔽',
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-slate-700/50 transition-colors">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="p-4">
                                            {typeof cell.column.columnDef.cell === 'function'
                                                ? cell.column.columnDef.cell(cell.getContext())
                                                : cell.getValue() as React.ReactNode}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="p-8 text-center text-slate-400">
                                    No agents found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                        <button
                            className="px-3 py-1 rounded border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            {'<<'}
                        </button>
                        <button
                            className="px-3 py-1 rounded border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            {'<'}
                        </button>
                        <button
                            className="px-3 py-1 rounded border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            {'>'}
                        </button>
                        <button
                            className="px-3 py-1 rounded border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            {'>>'}
                        </button>
                    </div>
                    <span className="flex items-center gap-1 text-slate-400">
                        <div>Page</div>
                        <strong>
                            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </strong>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AgentManagementPage;