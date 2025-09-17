import type { SettingsSectionProps } from '../types';

export function LanguageSettings({ activeSection }: SettingsSectionProps) {
    if (activeSection !== 'language') return null;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Language Settings</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        Interface Language
                    </label>
                    <select className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white">
                        <option>English</option>
                        <option>ไทย (Thai)</option>
                        <option>日本語 (Japanese)</option>
                        <option>한국어 (Korean)</option>
                        <option>中文 (Chinese)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        Date Format
                    </label>
                    <select className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white">
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        Time Format
                    </label>
                    <select className="w-full bg-[var(--console-bg-secondary)] border border-[var(--console-border)] rounded-lg px-3 py-2 text-white">
                        <option>12 Hour</option>
                        <option>24 Hour</option>
                    </select>
                </div>
            </div>
        </div>
    );
}