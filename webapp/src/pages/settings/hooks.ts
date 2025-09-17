import { useState, useEffect } from 'react';
import { SystemAPI, type DriveInfo } from '../../lib/systemapi';

export const useSystemDrives = () => {
    const [systemDrives, setSystemDrives] = useState<DriveInfo[]>([]);
    const [loadingDrives, setLoadingDrives] = useState(false);

    const loadSystemDrives = async () => {
        setLoadingDrives(true);
        try {
            const response = await SystemAPI.getDriveLetters();
            if (response.success && response.drives) {
                setSystemDrives(response.drives);
            }
        } catch (error) {
            console.error('Failed to load system drives:', error);
        } finally {
            setLoadingDrives(false);
        }
    };

    useEffect(() => {
        loadSystemDrives();
    }, []);

    return {
        systemDrives,
        loadingDrives,
        loadSystemDrives
    };
};

export const useSettingsHandlers = () => {
    const handleRestartLauncher = () => {
        if (confirm('Are you sure you want to restart the launcher?')) {
            // Implementation for restarting launcher
            window.location.reload();
        }
    };

    const handleCleanMemory = () => {
        if (confirm('Clean memory cache? This may temporarily slow down the launcher.')) {
            // Implementation for cleaning memory
            console.log('Cleaning memory...');
        }
    };

    const handleCheckUpdates = () => {
        // Implementation for checking Windows updates
        console.log('Checking Windows updates...');
    };

    return {
        handleRestartLauncher,
        handleCleanMemory,
        handleCheckUpdates
    };
};