import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Globe, Monitor, Shield, ChevronRight } from 'lucide-react';

function Settings() {
    const [activeSection, setActiveSection] = useState('general');

    const settingsSections = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'account', label: 'Account', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'language', label: 'Language & Region', icon: Globe },
        { id: 'display', label: 'Display', icon: Monitor },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    ];

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[var(--console-bg)] via-[var(--console-bg-secondary)] to-[var(--console-bg)]">
            {/* Background gradient for transparency */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
            
            <div className="relative z-10 pt-20 px-8 pb-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                        <p className="text-[var(--console-text-secondary)]">Customize your launcher experience</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-[var(--console-border)] p-4">
                                <nav className="space-y-2">
                                    {settingsSections.map((section) => {
                                        const Icon = section.icon;
                                        const isActive = activeSection === section.id;
                                        
                                        return (
                                            <button
                                                key={section.id}
                                                onClick={() => setActiveSection(section.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${
                                                    isActive 
                                                        ? 'bg-[var(--console-primary)] text-white' 
                                                        : 'hover:bg-white/5 text-[var(--console-text-secondary)] hover:text-white'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Icon className="w-5 h-5" />
                                                    <span className="font-medium">{section.label}</span>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="lg:col-span-3">
                            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-[var(--console-border)] p-6">
                                {activeSection === 'general' && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">
                                                    Close App Behavior
                                                </label>
                                                <select className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white">
                                                    <option>Minimize to Tray</option>
                                                    <option>Exit App</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-white font-medium">Auto-launch on startup</h3>
                                                    <p className="text-sm text-[var(--console-text-secondary)]">Start launcher when Windows boots</p>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'account' && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-medium">Player</h3>
                                                    <p className="text-sm text-[var(--console-text-secondary)]">Online</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'notifications' && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-white font-medium">Game Updates</h3>
                                                    <p className="text-sm text-[var(--console-text-secondary)]">Notify when games have updates</p>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5" defaultChecked />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-white font-medium">Download Complete</h3>
                                                    <p className="text-sm text-[var(--console-text-secondary)]">Notify when downloads finish</p>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5" defaultChecked />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'language' && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6">Language & Region</h2>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">
                                                    Language
                                                </label>
                                                <select className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white">
                                                    <option>English</option>
                                                    <option>ภาษาไทย</option>
                                                    <option>日本語</option>
                                                    <option>Indonesia</option>
                                                    <option>Русский</option>
                                                    <option>中文</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'display' && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6">Display Settings</h2>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-white font-medium">Hardware Acceleration</h3>
                                                    <p className="text-sm text-[var(--console-text-secondary)]">Use GPU for better performance</p>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5" defaultChecked />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'privacy' && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6">Privacy & Security</h2>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-white font-medium">Analytics</h3>
                                                    <p className="text-sm text-[var(--console-text-secondary)]">Help improve the launcher by sharing usage data</p>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-white font-medium">Crash Reports</h3>
                                                    <p className="text-sm text-[var(--console-text-secondary)]">Automatically send crash reports</p>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5" defaultChecked />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;