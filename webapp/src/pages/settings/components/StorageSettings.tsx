import { useState } from 'react';
import { HardDrive } from 'lucide-react';
import type { SettingsSectionProps } from '../types';
import { useSystemDrives } from '../hooks';
import { formatBytes } from '../utils';

export function StorageSettings({ activeSection }: SettingsSectionProps) {
    const [selectedInstallDrive, setSelectedInstallDrive] = useState('C:');
    const { systemDrives, loadingDrives } = useSystemDrives();

    if (activeSection !== 'storage') return null;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Storage Settings</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        Default Installation Path
                    </label>
                    <p className="text-xs text-[var(--console-text-secondary)] mb-4">
                        Games will be installed to: {selectedInstallDrive}\\MikoGames
                    </p>
                    
                    <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 space-y-3">
                        {loadingDrives ? (
                            <div className="flex items-center justify-center p-4 text-gray-400">
                                Loading drives...
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {systemDrives.map((drive) => (
                                    <button
                                        key={drive.letter}
                                        onClick={() => setSelectedInstallDrive(drive.letter)}
                                        className={`flex items-center justify-between w-full p-4 rounded-lg border transition-colors 
                                        ${selectedInstallDrive === drive.letter
                                                ? "bg-neutral-800 border-gray-500"
                                                : "bg-neutral-950 border-gray-700 hover:border-gray-500"
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <HardDrive className="w-5 h-5 text-gray-300" />
                                            <div className="text-left">
                                                <div className="text-sm font-medium">
                                                    {drive.letter}: {drive.label || 'Local Disk'}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {drive.type}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">
                                                {formatBytes(drive.freeSpace)} free
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                of {formatBytes(drive.totalSpace)}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Auto-clean temporary files</h3>
                        <p className="text-sm text-[var(--console-text-secondary)]">Automatically remove temporary download files</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
            </div>
        </div>
    );
}