import type { SettingsSectionProps } from '../types';

export function AccountSettings({ activeSection }: SettingsSectionProps) {
    if (activeSection !== 'account') return null;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white"
                        placeholder="Enter username"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white"
                        placeholder="Enter email"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Remember Login</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Stay logged in between sessions</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>

                <div className="border-t border-gray-700 pt-6">
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}