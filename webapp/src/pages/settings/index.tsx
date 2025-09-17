import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Globe, Monitor, Shield, HardDrive, Cpu} from 'lucide-react';
import type { SettingsProps } from './types';
import type { SettingsSectionId } from './types';
import {
    GeneralSettings,
    StorageSettings,
    SystemSettings,
    DisplaySettings,
    AccountSettings,
    NotificationSettings,
    LanguageSettings,
    PrivacySettings
} from './components';

export default function Settings({ onBack }: SettingsProps) {
    const [activeSection, setActiveSection] = useState<SettingsSectionId>('general');

    const handleSettingChange = (key: string, value: any) => {
        // Handle setting changes here
        console.log(`Setting changed: ${key} = ${value}`);
        // You can implement actual setting persistence logic here
    };

    const settingsSections = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'storage', label: 'Storage', icon: HardDrive },
        { id: 'system', label: 'System', icon: Cpu },
        { id: 'display', label: 'Display', icon: Monitor },
        { id: 'account', label: 'Account', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'language', label: 'Language & Region', icon: Globe },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center mb-8 pt-8">
                    <button
                        onClick={onBack}
                        className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                            <nav className="space-y-2">
                                {settingsSections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id as SettingsSectionId)}
                                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                                activeSection === section.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{section.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800">

                            <GeneralSettings activeSection={activeSection} onSettingChange={handleSettingChange} />
                            <StorageSettings activeSection={activeSection} onSettingChange={handleSettingChange} />
                            <SystemSettings activeSection={activeSection} onSettingChange={handleSettingChange} />
                            <DisplaySettings activeSection={activeSection} onSettingChange={handleSettingChange} />
                            <AccountSettings activeSection={activeSection} onSettingChange={handleSettingChange} />
                            <NotificationSettings activeSection={activeSection} onSettingChange={handleSettingChange} />
                            <LanguageSettings activeSection={activeSection} onSettingChange={handleSettingChange} />
                            <PrivacySettings activeSection={activeSection} onSettingChange={handleSettingChange} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}