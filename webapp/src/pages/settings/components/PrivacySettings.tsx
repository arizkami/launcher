import type { SettingsSectionProps } from '../types';

export function PrivacySettings({ activeSection }: SettingsSectionProps) {
    if (activeSection !== 'privacy') return null;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>
            <div className="space-y-6">
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

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Game Activity</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Share what games you're playing</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
                </div>

                <div className="border-t border-gray-700 pt-6">
                    <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Clear All Data
                    </button>
                </div>
            </div>
        </div>
    );
}