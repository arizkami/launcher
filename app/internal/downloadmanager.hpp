#pragma once

#include <string>
#include <vector>
#include <functional>
#include <memory>
#include <atomic>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>

namespace launcher {

struct DownloadInfo {
    std::string url;
    std::string destination;
    std::string filename;
    size_t totalSize = 0;
    size_t downloadedSize = 0;
    double progress = 0.0;
    bool isCompleted = false;
    bool isFailed = false;
    std::string errorMessage;
    int downloadId;
};

class DownloadManager {
public:
    using ProgressCallback = std::function<void(const DownloadInfo&)>;
    using CompletionCallback = std::function<void(const DownloadInfo&)>;

    DownloadManager();
    ~DownloadManager();

    // Start a download and return download ID
    int startDownload(const std::string& url, const std::string& destination, 
                     const std::string& filename = "");
    
    // Cancel a download by ID
    bool cancelDownload(int downloadId);
    
    // Get download info by ID
    DownloadInfo getDownloadInfo(int downloadId) const;
    
    // Get all active downloads
    std::vector<DownloadInfo> getAllDownloads() const;
    
    // Set callbacks
    void setProgressCallback(ProgressCallback callback);
    void setCompletionCallback(CompletionCallback callback);
    
    // Check if download manager is busy
    bool isBusy() const;
    
    // Get total download progress (0.0 to 1.0)
    double getTotalProgress() const;

private:
    struct DownloadTask {
        int id;
        std::string url;
        std::string destination;
        std::string filename;
        std::shared_ptr<DownloadInfo> info;
    };

    void workerThread();
    bool downloadFile(const DownloadTask& task);
    void updateProgress(std::shared_ptr<DownloadInfo> info, size_t downloaded, size_t total);
    
    std::atomic<bool> m_running;
    std::atomic<int> m_nextDownloadId;
    
    std::thread m_workerThread;
    std::mutex m_queueMutex;
    std::condition_variable m_queueCondition;
    std::queue<DownloadTask> m_downloadQueue;
    
    mutable std::mutex m_downloadsMutex;
    std::vector<std::shared_ptr<DownloadInfo>> m_downloads;
    
    ProgressCallback m_progressCallback;
    CompletionCallback m_completionCallback;
    std::mutex m_callbackMutex;
};

} // namespace launcher