"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

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

    useEffect(() => {
        // Load agent data from localStorage
        const userData = localStorage.getItem("agent");
        if (userData) {
            const agent = JSON.parse(userData);
            setAgentName(agent.name || "Agent");
        }
    }, []);

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
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}