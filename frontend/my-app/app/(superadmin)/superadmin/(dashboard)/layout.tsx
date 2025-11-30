"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    Bell,
    User,
    ChevronDown,
} from "lucide-react";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [adminName, setAdminName] = useState("SuperAdmin");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Load superadmin data from localStorage
        const userData = localStorage.getItem("superadmin");
        if (userData) {
            const admin = JSON.parse(userData);
            setAdminName(admin.name || "SuperAdmin");
        }
    }, []);

    const navigation = [
        {
            name: "Dashboard",
            href: "/superadmin/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Agent Management",
            href: "/superadmin/agents",
            icon: Users,
        },
        {
            name: "Analytics",
            href: "/superadmin/analytics",
            icon: BarChart3,
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("superadmin");
        localStorage.removeItem("superadminToken");
        router.push("/superadmin/login");
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Sidebar - Desktop */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 ${sidebarOpen ? "w-72" : "w-20"}`}
            >
                <div className="h-full flex flex-col bg-gray-950 text-white border-r border-gray-800">
                    {/* Logo Section */}
                    <div className="h-20 flex items-center justify-between px-4 border-b border-red-900/30">
                        {sidebarOpen && (
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/50">
                                    <Shield className="w-7 h-7" />
                                </div>
                                <div>
                                    <span className="text-xl font-bold">SuperAdmin</span>
                                    <p className="text-xs text-gray-400">Control Panel</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-800 transition-colors lg:block hidden"
                        >
                            {sidebarOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Admin Info Section */}
                    <div className="px-4 py-6 border-b border-gray-800">
                        {sidebarOpen ? (
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                        <Shield className="w-7 h-7" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-950" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{adminName}</p>
                                    <p className="text-xs text-red-400">System Administrator</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-950" />
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
                                            ? "bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-lg shadow-red-500/30"
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

                    {/* Warning Section */}
                    {sidebarOpen && (
                        <div className="px-4 py-4 mx-3 mb-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                            <p className="text-xs text-orange-400 flex items-center space-x-2">
                                <span>⚠️</span>
                                <span>All actions are logged</span>
                            </p>
                        </div>
                    )}

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
            <div className={`transition-all ${sidebarOpen ? "lg:pl-72" : "lg:pl-20"}`}>
                {/* Top Header Bar */}
                <header className="h-20 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-gray-800 lg:hidden text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Page Title */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">
                            {pathname === "/superadmin/dashboard" && "System Overview"}
                            {pathname === "/superadmin/agents" && "Agent Management"}
                            {pathname === "/superadmin/analytics" && "System Analytics"}
                        </h2>
                        <p className="text-sm text-gray-400">
                            Last updated: {new Date().toLocaleTimeString()}
                        </p>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors text-white">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <div className="w-9 h-9 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-950 rounded-lg shadow-lg border border-gray-800 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-800">
                                        <p className="text-sm font-medium text-white">
                                            {adminName}
                                        </p>
                                        <p className="text-xs text-gray-400">SuperAdmin</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
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