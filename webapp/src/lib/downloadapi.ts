// Download API for interfacing with the backend download manager
// This uses the existing nativeAPI.call system to communicate with C++ backend

export interface DownloadInfo {
  id: string;
  url: string;
  filename: string;
  totalBytes: number;
  downloadedBytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  speed: number; // bytes per second
  error?: string;
}

export interface StartDownloadRequest {
  url: string;
  filename: string;
  directory?: string;
}

export interface StartDownloadResponse {
  success: boolean;
  downloadId?: string;
  error?: string;
}

export interface CancelDownloadResponse {
  success: boolean;
  error?: string;
}

export interface GetDownloadInfoResponse {
  success: boolean;
  downloadInfo?: DownloadInfo;
  error?: string;
}

export interface GetAllDownloadsResponse {
  success: boolean;
  downloads?: DownloadInfo[];
  error?: string;
}

declare global {
  interface Window {
    nativeAPI: {
      call: (method: string, message?: string) => Promise<string>;
    };
  }
}

export class DownloadAPI {
  /**
   * Start a new download
   */
  static async startDownload(request: StartDownloadRequest): Promise<StartDownloadResponse> {
    try {
      const message = JSON.stringify(request);
      const response = await window.nativeAPI.call('startDownload', message);
      return JSON.parse(response) as StartDownloadResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel an active download
   */
  static async cancelDownload(downloadId: string): Promise<CancelDownloadResponse> {
    try {
      const message = JSON.stringify({ downloadId });
      const response = await window.nativeAPI.call('cancelDownload', message);
      return JSON.parse(response) as CancelDownloadResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get information about a specific download
   */
  static async getDownloadInfo(downloadId: string): Promise<GetDownloadInfoResponse> {
    try {
      const message = JSON.stringify({ downloadId });
      const response = await window.nativeAPI.call('getDownloadInfo', message);
      return JSON.parse(response) as GetDownloadInfoResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get information about all downloads
   */
  static async getAllDownloads(): Promise<GetAllDownloadsResponse> {
    try {
      const response = await window.nativeAPI.call('getAllDownloads', '{}');
      return JSON.parse(response) as GetAllDownloadsResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Utility function to format bytes to human readable format
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Utility function to format download speed
   */
  static formatSpeed(bytesPerSecond: number): string {
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  /**
   * Utility function to estimate remaining time
   */
  static estimateTimeRemaining(totalBytes: number, downloadedBytes: number, speed: number): string {
    if (speed === 0 || downloadedBytes >= totalBytes) return 'Unknown';
    
    const remainingBytes = totalBytes - downloadedBytes;
    const remainingSeconds = remainingBytes / speed;
    
    if (remainingSeconds < 60) {
      return Math.ceil(remainingSeconds) + 's';
    } else if (remainingSeconds < 3600) {
      return Math.ceil(remainingSeconds / 60) + 'm';
    } else {
      return Math.ceil(remainingSeconds / 3600) + 'h';
    }
  }
}