"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, LogOut, User } from "lucide-react";

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [customerName, setCustomerName] = useState("Customer");
    const [isConnected, setIsConnected] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Load customer data from localStorage
        const userData = localStorage.getItem("customer");
        if (userData) {
            const customer = JSON.parse(userData);
            setCustomerName(customer.name || "Customer");
            setIsConnected(true);
        }
    }, []);

    const handleDisconnect = () => {
        localStorage.removeItem("customer");
        setIsConnected(false);
        router.push("/customer/register");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <header className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Phone className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Call Center
                                </h1>
                                <p className="text-sm text-gray-500">Customer Portal</p>
                            </div>
                        </div>

                        {/* Customer Info & Actions */}
                        {isConnected && (
                            <div className="flex items-center space-x-4">
                                {/* Customer Name */}
                                <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {customerName}
                                    </span>
                                </div>

                                {/* Disconnect Button */}
                                <button
                                    onClick={handleDisconnect}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Disconnect</span>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main>{children}</main>

                {/* Footer */}
                <footer className="mt-8 text-center">
                    <p className="text-white/80 text-sm">
                        Need help? Contact support@callcenter.com
                    </p>
                    <p className="text-white/60 text-xs mt-2">
                        © 2024 Call Center. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
}