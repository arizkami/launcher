import type { SettingsSectionProps } from '../types';

export function NotificationSettings({ activeSection }: SettingsSectionProps) {
    if (activeSection !== 'notifications') return null;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
            <div className="space-y-6">
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

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">System Notifications</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Show Windows notifications</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Sound Notifications</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Play sound for notifications</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}