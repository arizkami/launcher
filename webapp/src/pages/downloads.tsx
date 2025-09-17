import { useState, useEffect } from "react";
import { Pause, Play, X, HardDrive, Download, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { DownloadAPI, type DownloadInfo as APIDownloadInfo } from "../lib/downloadapi";

interface DownloadInfo {
  id: string;
  name: string;
  size: string;
  downloaded: string;
  progress: number; // 0 - 100
  status: "pending" | "downloading" | "completed" | "failed" | "cancelled";
  speed?: string;
  eta?: string;
}

interface DownloadsProps {
  onBack?: () => void;
}

export default function Downloads({ onBack }: DownloadsProps) {
  const [downloads, setDownloads] = useState<DownloadInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch downloads from API
  const fetchDownloads = async () => {
    try {
      const response = await DownloadAPI.getAllDownloads();
      if (response.success && response.downloads) {
        const formattedDownloads: DownloadInfo[] = response.downloads.map((download: APIDownloadInfo) => ({
          id: download.id,
          name: download.filename,
          size: DownloadAPI.formatBytes(download.totalBytes),
          downloaded: DownloadAPI.formatBytes(download.downloadedBytes),
          progress: download.progress,
          status: download.status,
          speed: download.speed > 0 ? DownloadAPI.formatSpeed(download.speed) : undefined,
          eta: download.speed > 0 ? DownloadAPI.estimateTimeRemaining(download.totalBytes, download.downloadedBytes, download.speed) : undefined
        }));
        setDownloads(formattedDownloads);
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchDownloads, 2000);
    return () => clearInterval(interval);
  }, []);

  const togglePause = async (id: string) => {
    // Note: This would need to be implemented in the backend
    // For now, we'll just update the local state
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: d.status === "downloading" ? "cancelled" : "downloading",
            }
          : d
      )
    );
  };

  const cancelDownload = async (id: string) => {
    try {
      const response = await DownloadAPI.cancelDownload(id);
      if (response.success) {
        setDownloads((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading downloads...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full bg-black text-white p-6 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-6">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold">Downloads</h1>
        </div>
        <div className="text-sm text-gray-400">
          {downloads.length} active downloads
        </div>
      </div>

      {/* Downloads List */}
      <div className="space-y-4">
        {downloads.length === 0 ? (
          <div className="text-center py-12">
            <Download className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No downloads in progress</p>
          </div>
        ) : (
          downloads.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between bg-neutral-900 rounded-lg p-4 border border-neutral-800"
            >
              {/* Left side */}
              <div className="flex items-center space-x-4 w-full">
                <HardDrive className="w-8 h-8 text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold truncate">{d.name}</h2>
                  <div className="w-full bg-neutral-700 h-2 rounded mt-2">
                    <div
                      className={`h-2 rounded transition-all duration-300 ${
                        d.status === 'completed' ? 'bg-green-500' :
                        d.status === 'failed' ? 'bg-red-500' :
                        d.status === 'cancelled' ? 'bg-gray-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${d.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-400">
                      {d.downloaded} / {d.size} • {Math.round(d.progress)}%
                    </p>
                    {d.speed && d.eta && d.status === 'downloading' && (
                      <p className="text-xs text-gray-400">
                        {d.speed} • ETA: {d.eta}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {d.status === "downloading" ? (
                  <button
                    onClick={() => togglePause(d.id)}
                    className="p-2 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : d.status === "pending" ? (
                  <button
                    onClick={() => togglePause(d.id)}
                    className="p-2 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    title="Resume"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                ) : d.status === "completed" ? (
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Complete</span>
                  </div>
                ) : d.status === "failed" ? (
                  <span className="text-red-400 text-xs">Failed</span>
                ) : (
                  <span className="text-gray-400 text-xs">Cancelled</span>
                )}

                {d.status !== "completed" && (
                  <button
                    onClick={() => cancelDownload(d.id)}
                    className="p-2 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
