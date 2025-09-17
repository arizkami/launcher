import type { SettingsSectionProps } from '../types';

export function DisplaySettings({ activeSection }: SettingsSectionProps) {
    if (activeSection !== 'display') return null;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Display Settings</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        Theme
                    </label>
                    <select className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white">
                        <option>Dark</option>
                        <option>Light</option>
                        <option>Auto</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        UI Scale
                    </label>
                    <select className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white">
                        <option>Small (90%)</option>
                        <option>Normal (100%)</option>
                        <option>Large (110%)</option>
                        <option>Extra Large (125%)</option>
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Show FPS Counter</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Display frame rate in games</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Smooth Animations</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Enable UI transition effects</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">High DPI Support</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Optimize for high resolution displays</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
            </div>
        </div>
    );
}