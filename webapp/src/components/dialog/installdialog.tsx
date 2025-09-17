import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, HardDrive } from 'lucide-react';
import { WuwaFetcher, type WuwaGameData } from '../../lib/wuwafetch';
import { DownloadAPI, type DownloadInfo } from '../../lib/downloadapi';
import { SystemAPI, type DriveInfo } from '../../lib/systemapi';
import WuwaIcon from "../../assets/amimegames/wuwa.png"

interface InstallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  onCancel: () => void;
  onNavigateToDownloads?: () => void;
  wuwaGameData: WuwaGameData | null;
  isInstalling: boolean;
  isPaused?: boolean;
  downloadProgress: number;
  downloadInfo: DownloadInfo | null;
  currentFileIndex: number;
  currentFileName: string;
  selectedDisk?: string;
  availableDisks?: Array<{
    id: string;
    name: string;
    free: string;
  }>;
  onDiskSelect?: (diskId: string) => void;
}

const InstallDialog: React.FC<InstallDialogProps> = ({
  isOpen,
  onClose,
  onInstall,
  onCancel,
  onNavigateToDownloads,
  wuwaGameData,
  isInstalling,
  isPaused = false,
  downloadProgress,
  downloadInfo,
  currentFileIndex,
  currentFileName,
  selectedDisk,
  availableDisks = [],
  onDiskSelect
}) => {
  const [systemDrives, setSystemDrives] = useState<DriveInfo[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(false);

  // Load system drives when component mounts
  useEffect(() => {
    const loadDrives = async () => {
      if (isOpen && !isInstalling) {
        setLoadingDrives(true);
        try {
          const result = await SystemAPI.getDriveLetters();
          if (result.success && result.drives) {
            setSystemDrives(result.drives);
          } else {
            console.error('Failed to load drives:', result.error);
          }
        } catch (error) {
          console.error('Error loading drives:', error);
        } finally {
          setLoadingDrives(false);
        }
      }
    };

    loadDrives();
  }, [isOpen, isInstalling]);

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const handleLocateGame = async () => {
    try {
      const result = await SystemAPI.showFolderDialog();
      
      if (result.success && result.path) {
        // Handle the selected folder path
        console.log('Selected game folder:', result.path);
        // You can add logic here to validate if the selected folder contains the game
        // and potentially close the dialog or update the UI accordingly
      } else if (result.cancelled) {
        console.log('Folder selection was cancelled');
      } else if (result.error) {
        console.error('Error showing folder dialog:', result.error);
      }
    } catch (error) {
      console.error('Failed to show folder dialog:', error);
    }
  };

  const handleInstall = async () => {
    try {
      // Create download task
      if (wuwaGameData) {
        const downloadTask = await DownloadAPI.startDownload({
          url: wuwaGameData.baseUrl || '',
          filename: gameInfo.name,
          directory: selectedDisk || 'C:'
        });
        
        if (downloadTask.success) {
          // Close dialog and navigate to downloads
          onClose();
          if (onNavigateToDownloads) {
            onNavigateToDownloads();
          }
        }
      }
      
      // Call original install handler
      onInstall();
    } catch (error) {
      console.error('Failed to start download:', error);
      // Fallback to original install handler
      onInstall();
    }
  };

  const gameInfo = {
    name: "Wuthering Waves",
    publisher: "Kuro Games",
    version: "1.0.0",
    icon: WuwaIcon,
    totalSize: wuwaGameData ? WuwaFetcher.formatBytes(wuwaGameData.totalSize) : "0 MB"
  };

  return (
    <AnimatePresence>
      {isOpen && wuwaGameData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-[500px] bg-neutral-900 border border-[#383838] text-white rounded-xl shadow-lg p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={gameInfo.icon}
                  alt="Game Icon"
                  className="w-16 h-16 rounded-lg"
                />
                <div>
                  <h1 className="text-xl font-semibold">{gameInfo.name}</h1>
                  <p className="text-sm text-gray-400">{gameInfo.publisher}</p>
                  <p className="text-xs text-gray-500">Version: {gameInfo.version}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Installation Progress (only show when installing) */}
            {isInstalling && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">
                    Installing... ({currentFileIndex + 1}/{wuwaGameData?.resources?.length || 0})
                  </span>
                  <span className="text-sm text-gray-400">
                    {downloadInfo ? DownloadAPI.formatSpeed(downloadInfo.speed) : '0 MB/s'}
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{currentFileName || 'Preparing...'}</span>
                  <span>
                    ETA: {downloadInfo ? DownloadAPI.estimateTimeRemaining(downloadInfo.totalBytes, downloadInfo.downloadedBytes, downloadInfo.speed) : 'Calculating...'}
                  </span>
                </div>
              </div>
            )}

            {/* Installation Info (only show when not installing) */}
            {!isInstalling && (
              <div className="space-y-2">
                <p className="text-sm text-gray-300">Select Installation</p>
                <p className="text-xs text-gray-500">Total Size: {gameInfo.totalSize}</p>

                <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 space-y-3">
                  {loadingDrives ? (
                    <div className="flex items-center justify-center p-4 text-gray-400">
                      Loading drives...
                    </div>
                  ) : systemDrives.length > 0 ? (
                    <div className="space-y-3">
                      {systemDrives.map((drive) => (
                        <button
                          key={drive.letter}
                          onClick={() => onDiskSelect?.(drive.letter)}
                          className={`flex text-black items-center justify-between w-full p-4 rounded-lg border transition-colors 
                          ${
                            selectedDisk === drive.letter
                              ? "bg-neutral-800 border-gray-500"
                              : "bg-[#D9D9D9] border-gray-700 hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <HardDrive className="w-5 h-5 text-black" />
                            <div className="text-left">
                              <div className="text-sm font-semibold">
                                ({drive.letter}) {drive.label || 'Local Disk'}
                              </div>
                              <div className="text-xs text-black/60">
                                {drive.type}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-black/80">
                              {formatBytes(drive.freeSpace)} free
                            </div>
                            <div className="text-xs text-black/60">
                              of {formatBytes(drive.totalSpace)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableDisks.map((disk) => (
                        <button
                          key={disk.id}
                          onClick={() => onDiskSelect?.(disk.id)}
                          className={`flex items-center justify-between w-full p-4 rounded-lg border transition-colors 
                          ${
                            selectedDisk === disk.id
                              ? "bg-neutral-800 border-gray-500"
                              : "bg-neutral-950 border-gray-700 hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <HardDrive className="w-5 h-5 text-gray-300" />
                            <span className="text-sm">{disk.name}</span>
                          </div>
                          <span className="text-sm text-gray-400">{disk.free}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Bar */}
            <div className="flex justify-between items-center text-sm">
              {!isInstalling ? (
                <>
                  <p className="text-gray-400">
                    is Installed?{" "}
                    <span 
                      className="text-white hover:underline cursor-pointer"
                      onClick={handleLocateGame}
                    >
                      Locate Game
                    </span>
                  </p>
                  <button 
                    onClick={handleInstall}
                    className="bg-gray-300 text-black font-semibold px-6 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Install
                  </button>
                </>
              ) : (
                <div className="flex justify-end space-x-3 w-full">
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isPaused ? <Play size={16} /> : <Pause size={16} />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallDialog;
