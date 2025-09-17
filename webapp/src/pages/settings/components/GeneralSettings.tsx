import type { SettingsSectionProps } from '../types';

export function GeneralSettings({ activeSection }: SettingsSectionProps) {
    if (activeSection !== 'general') return null;

    return (
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
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Auto-update games</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Automatically download game updates</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
            </div>
        </div>
    );
}