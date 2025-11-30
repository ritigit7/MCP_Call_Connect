"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Bell,
  Mic,
  Palette,
  Settings2,
  ChevronRight,
  Eye,
  EyeOff,
  UploadCloud,
  Trash2,
  LogOut,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";

type SettingCategory =
  | "profile"
  | "security"
  | "notifications"
  | "audio"
  | "appearance"
  | "preferences";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingCategory>("profile");

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "audio":
        return <AudioSettings />;
      case "appearance":
        return <AppearanceSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-8 overflow-y-auto">{renderContent()}</main>
    </div>
  );
};

const SettingsSidebar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: SettingCategory;
  setActiveTab: (tab: SettingCategory) => void;
}) => {
  const navItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "audio", label: "Audio", icon: Mic },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "preferences", label: "Preferences", icon: Settings2 },
  ];

  return (
    <aside className="w-[250px] bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="flex items-center gap-2 px-2 pb-4 border-b border-gray-200">
        <Settings2 className="w-6 h-6 text-gray-600" />
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
      </div>
      <nav className="mt-6 flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id as SettingCategory)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

const SettingsCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
        <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const ProfileSettings = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
    <SettingsCard title="Your Photo">
        <div className="flex items-center gap-6">
            <img src="https://via.placeholder.com/120" alt="Avatar" className="w-30 h-30 rounded-full object-cover" />
            <div className="flex flex-col gap-2">
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Change Photo</button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Remove</button>
            </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">JPG or PNG. Max size 2MB</p>
    </SettingsCard>
    <SettingsCard title="Account Details">
        <form className="space-y-6">
            {/* Form fields here */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                <p className="mt-2 text-xs text-gray-500">Used for login and notifications.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Role/Title</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Bio (Optional)</label>
                <textarea rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                <p className="mt-2 text-xs text-gray-500">150 characters max.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Changes</button>
            </div>
        </form>
    </SettingsCard>
  </div>
);

const SecuritySettings = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Security</h2>
    <SettingsCard title="Change Password">
        {/* Password fields here */}
    </SettingsCard>
    <SettingsCard title="Two-Factor Authentication">
        {/* 2FA content here */}
    </SettingsCard>
    <SettingsCard title="Active Sessions">
        {/* Sessions content here */}
    </SettingsCard>
  </div>
);

const NotificationSettings = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Notifications</h2>
    <SettingsCard title="Notification Preferences">
        <div className="space-y-6">
            <div>
                <h4 className="font-medium text-gray-800">📧 Email Notifications</h4>
                <div className="mt-4 space-y-2">
                    <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked /> <span className="ml-2 text-sm text-gray-600">New call assignments</span></label>
                    <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked /> <span className="ml-2 text-sm text-gray-600">Missed calls</span></label>
                    <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" /> <span className="ml-2 text-sm text-gray-600">Performance reports (weekly)</span></label>
                </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-800">🔔 Push Notifications</h4>
                <div className="mt-4 space-y-2">
                    <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked /> <span className="ml-2 text-sm text-gray-600">Incoming calls</span></label>
                    <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" /> <span className="ml-2 text-sm text-gray-600">Messages from customers</span></label>
                </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-800">🔊 Sound Notifications</h4>
                <div className="mt-4 space-y-4">
                    <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked /> <span className="ml-2 text-sm text-gray-600">Play sound for incoming calls</span></label>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Volume</label>
                        <input type="range" min="0" max="100" defaultValue="80" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Test Sound</button>
                </div>
            </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Preferences</button>
        </div>
    </SettingsCard>
  </div>
);

const AudioSettings = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Audio Settings</h2>
    <SettingsCard title="Input & Output Devices">
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">🎤 Microphone</label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option>Default - Built-in Microphone</option>
                    <option>External USB Mic</option>
                </select>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{width: "45%"}}></div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">🔊 Speaker/Headphones</label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option>Default - Built-in Speaker</option>
                    <option>Bluetooth Headphones</option>
                </select>
                <button className="mt-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Test Speaker</button>
            </div>
        </div>
    </SettingsCard>
    <SettingsCard title="Advanced Audio">
        <div className="space-y-4">
            <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked /> <span className="ml-2 text-sm text-gray-600">Noise suppression</span></label>
            <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked /> <span className="ml-2 text-sm text-gray-600">Echo cancellation</span></label>
            <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" /> <span className="ml-2 text-sm text-gray-600">Auto gain control</span></label>
        </div>
    </SettingsCard>
  </div>
);

const AppearanceSettings = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Appearance</h2>
    <SettingsCard title="Theme Preferences">
        <div className="space-y-6">
            <div>
                <h4 className="font-medium text-gray-800">🎨 Color Theme</h4>
                <div className="mt-4 grid grid-cols-3 gap-4">
                    <button className="p-4 border-2 border-blue-500 rounded-lg text-center bg-white">
                        <Sun className="mx-auto mb-2 w-6 h-6 text-yellow-500" />
                        <span className="font-medium text-sm">Light</span>
                    </button>
                    <button className="p-4 border border-gray-300 rounded-lg text-center hover:border-blue-500">
                        <Moon className="mx-auto mb-2 w-6 h-6 text-gray-600" />
                        <span className="font-medium text-sm">Dark</span>
                    </button>
                    <button className="p-4 border border-gray-300 rounded-lg text-center hover:border-blue-500">
                        <Laptop className="mx-auto mb-2 w-6 h-6 text-gray-600" />
                        <span className="font-medium text-sm">Auto</span>
                    </button>
                </div>
            </div>
            <div>
                <h4 className="font-medium text-gray-800">Accent Color</h4>
                <div className="mt-4 flex gap-3">
                    <button className="w-8 h-8 rounded-full bg-blue-600 ring-2 ring-offset-2 ring-blue-600"></button>
                    <button className="w-8 h-8 rounded-full bg-purple-600"></button>
                    <button className="w-8 h-8 rounded-full bg-green-600"></button>
                    <button className="w-8 h-8 rounded-full bg-orange-600"></button>
                    <button className="w-8 h-8 rounded-full bg-red-600"></button>
                </div>
            </div>
            <div>
                <h4 className="font-medium text-gray-800">Compact Mode</h4>
                <label className="flex items-center mt-2"><input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" /> <span className="ml-2 text-sm text-gray-600">Use compact layout</span></label>
                <p className="text-xs text-gray-500 mt-1">Show more content on screen.</p>
            </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Apply Changes</button>
        </div>
    </SettingsCard>
  </div>
);

export default SettingsPage;