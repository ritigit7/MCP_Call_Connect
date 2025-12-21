"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Plus, MoreVertical, X, CheckCircle,
    Star, TrendingUp, TrendingDown, Loader2, Edit, Trash2, Eye, RotateCcw, Power, AlertTriangle
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
    deletedAt?: string | null;
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-50 w-full max-w-lg bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-6 mx-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// Create/Edit Agent Form
const AgentForm = ({ agent, onSubmit, onCancel, isLoading }: {
    agent?: Agent | null;
    onSubmit: (data: { name: string; email: string; password?: string }) => void;
    onCancel: () => void;
    isLoading: boolean;
}) => {
    const [name, setName] = useState(agent?.name || '');
    const [email, setEmail] = useState(agent?.email || '');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: { name: string; email: string; password?: string } = { name, email };
        if (!agent && password) data.password = password;
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter agent name"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter email address"
                    required
                />
            </div>
            {!agent && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Enter password (min 6 characters)"
                        required
                        minLength={6}
                    />
                </div>
            )}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 bg-slate-700 text-gray-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {agent ? 'Update Agent' : 'Create Agent'}
                </button>
            </div>
        </form>
    );
};

// Delete Confirmation Dialog
const DeleteConfirmation = ({ agent, onConfirm, onCancel, isLoading, isPermanent }: {
    agent: Agent;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
    isPermanent?: boolean;
}) => (
    <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isPermanent ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <AlertTriangle className={`w-8 h-8 ${isPermanent ? 'text-red-500' : 'text-yellow-500'}`} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
            {isPermanent ? 'Permanently Delete Agent?' : 'Deactivate Agent?'}
        </h3>
        <p className="text-gray-400 mb-6">
            {isPermanent
                ? `This will permanently delete "${agent.name}". This action cannot be undone.`
                : `This will deactivate "${agent.name}". The agent can be restored later.`
            }
        </p>
        <div className="flex gap-3">
            <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-slate-700 text-gray-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-4 py-3 ${isPermanent ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPermanent ? 'Delete Permanently' : 'Deactivate'}
            </button>
        </div>
    </div>
);

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

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    const getToken = () => localStorage.getItem("superAdminToken");

    const fetchAgents = async () => {
        try {
            const token = getToken();
            if (!token) {
                router.push('/superadmin/login');
                return;
            }

            const response = await fetch(`${baseURL}/superadmin/agents?isActive=${!showInactive}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch agents');
            }

            const responseData = await response.json();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedAgents: Agent[] = responseData.agents.map((agent: any) => ({
                id: agent._id,
                name: agent.name,
                email: agent.email,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random`,
                status: (agent.status.charAt(0).toUpperCase() + agent.status.slice(1)) as AgentStatus,
                calls: {
                    total: agent.totalCalls || 0,
                    trend: 'stable'
                },
                score: agent.avgPerformanceScore || 0,
                isActive: agent.isActive,
                deletedAt: agent.deletedAt
            }));

            setData(mappedAgents);
        } catch (err) {
            console.error("Error fetching agents:", err);
            setError("Failed to load agents. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [router, showInactive]);

    // Create Agent
    const handleCreateAgent = async (agentData: { name: string; email: string; password?: string }) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${baseURL}/superadmin/agents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify(agentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create agent');
            }

            setShowCreateModal(false);
            fetchAgents();
        } catch (err) {
            console.error("Error creating agent:", err);
            alert((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update Agent
    const handleUpdateAgent = async (agentData: { name: string; email: string }) => {
        if (!selectedAgent) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${baseURL}/superadmin/agents/${selectedAgent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify(agentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update agent');
            }

            setShowEditModal(false);
            setSelectedAgent(null);
            fetchAgents();
        } catch (err) {
            console.error("Error updating agent:", err);
            alert((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete/Deactivate Agent
    const handleDeleteAgent = async () => {
        if (!selectedAgent) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${baseURL}/superadmin/agents/${selectedAgent.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete agent');
            }

            setShowDeleteModal(false);
            setSelectedAgent(null);
            fetchAgents();
        } catch (err) {
            console.error("Error deleting agent:", err);
            alert((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Restore Agent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleRestoreAgent = async (agent: Agent) => {
        try {
            const response = await fetch(`${baseURL}/superadmin/agents/${agent.id}/restore`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to restore agent');
            }

            fetchAgents();
        } catch (err) {
            console.error("Error restoring agent:", err);
            alert((err as Error).message);
        }
    };

    // Toggle Agent Status
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleToggleStatus = async (agent: Agent) => {
        try {
            const response = await fetch(`${baseURL}/superadmin/agents/${agent.id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to toggle agent status');
            }

            fetchAgents();
        } catch (err) {
            console.error("Error toggling status:", err);
            alert((err as Error).message);
        }
    };

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
                cell: ({ row }) => {
                    const agent = row.original;
                    const isMenuOpen = actionMenuId === agent.id;

                    return (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActionMenuId(isMenuOpen ? null : agent.id);
                                }}
                                className="p-2 rounded-full hover:bg-slate-700"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 z-20 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1">
                                    <button
                                        onClick={() => {
                                            router.push(`/superadmin/agents/${agent.id}`);
                                            setActionMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700"
                                    >
                                        <Eye className="w-4 h-4" /> View Details
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedAgent(agent);
                                            setShowEditModal(true);
                                            setActionMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700"
                                    >
                                        <Edit className="w-4 h-4" /> Edit Agent
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleToggleStatus(agent);
                                            setActionMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700"
                                    >
                                        <Power className="w-4 h-4" /> {agent.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    {!agent.isActive && (
                                        <button
                                            onClick={() => {
                                                handleRestoreAgent(agent);
                                                setActionMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-slate-700"
                                        >
                                            <RotateCcw className="w-4 h-4" /> Restore Agent
                                        </button>
                                    )}
                                    <div className="border-t border-slate-600 my-1" />
                                    <button
                                        onClick={() => {
                                            setSelectedAgent(agent);
                                            setShowDeleteModal(true);
                                            setActionMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Agent
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                },
            },
        ],
        [actionMenuId, router, handleToggleStatus, handleRestoreAgent]
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
        <div className="bg-slate-900 min-h-screen text-white p-8" onClick={() => setActionMenuId(null)}>
            {/* Create Agent Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Agent">
                <AgentForm
                    onSubmit={handleCreateAgent}
                    onCancel={() => setShowCreateModal(false)}
                    isLoading={isSubmitting}
                />
            </Modal>

            {/* Edit Agent Modal */}
            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedAgent(null); }} title="Edit Agent">
                <AgentForm
                    agent={selectedAgent}
                    onSubmit={handleUpdateAgent}
                    onCancel={() => { setShowEditModal(false); setSelectedAgent(null); }}
                    isLoading={isSubmitting}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedAgent(null); }} title="Confirm Action">
                {selectedAgent && (
                    <DeleteConfirmation
                        agent={selectedAgent}
                        onConfirm={handleDeleteAgent}
                        onCancel={() => { setShowDeleteModal(false); setSelectedAgent(null); }}
                        isLoading={isSubmitting}
                    />
                )}
            </Modal>

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Agent Management</h1>
                    <p className="text-slate-400 mt-1">Manage all agents and their performance</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform"
                >
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
                    {/* Status Filter Toggle */}
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${showInactive
                            ? 'bg-yellow-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {showInactive ? 'Showing Inactive' : 'Show Inactive'}
                    </button>
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