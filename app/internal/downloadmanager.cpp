#include "downloadmanager.hpp"
#include <httplib.h>
#include <filesystem>
#include <fstream>
#include <iostream>

namespace launcher {

DownloadManager::DownloadManager() 
    : m_running(true), m_nextDownloadId(1) {
    m_workerThread = std::thread(&DownloadManager::workerThread, this);
}

DownloadManager::~DownloadManager() {
    m_running = false;
    m_queueCondition.notify_all();
    
    if (m_workerThread.joinable()) {
        m_workerThread.join();
    }
}

int DownloadManager::startDownload(const std::string& url, const std::string& destination, 
                                  const std::string& filename) {
    int downloadId = m_nextDownloadId++;
    
    auto info = std::make_shared<DownloadInfo>();
    info->url = url;
    info->destination = destination;
    info->filename = filename.empty() ? std::filesystem::path(url).filename().string() : filename;
    info->downloadId = downloadId;
    
    {
        std::lock_guard<std::mutex> lock(m_downloadsMutex);
        m_downloads.push_back(info);
    }
    
    DownloadTask task;
    task.id = downloadId;
    task.url = url;
    task.destination = destination;
    task.filename = info->filename;
    task.info = info;
    
    {
        std::lock_guard<std::mutex> lock(m_queueMutex);
        m_downloadQueue.push(task);
    }
    
    m_queueCondition.notify_one();
    return downloadId;
}

bool DownloadManager::cancelDownload(int downloadId) {
    std::lock_guard<std::mutex> lock(m_downloadsMutex);
    
    for (auto& info : m_downloads) {
        if (info->downloadId == downloadId && !info->isCompleted) {
            info->isFailed = true;
            info->errorMessage = "Download cancelled by user";
            return true;
        }
    }
    
    return false;
}

DownloadInfo DownloadManager::getDownloadInfo(int downloadId) const {
    std::lock_guard<std::mutex> lock(m_downloadsMutex);
    
    for (const auto& info : m_downloads) {
        if (info->downloadId == downloadId) {
            return *info;
        }
    }
    
    return DownloadInfo{};
}

std::vector<DownloadInfo> DownloadManager::getAllDownloads() const {
    std::lock_guard<std::mutex> lock(m_downloadsMutex);
    
    std::vector<DownloadInfo> result;
    for (const auto& info : m_downloads) {
        result.push_back(*info);
    }
    
    return result;
}

void DownloadManager::setProgressCallback(ProgressCallback callback) {
    std::lock_guard<std::mutex> lock(m_callbackMutex);
    m_progressCallback = callback;
}

void DownloadManager::setCompletionCallback(CompletionCallback callback) {
    std::lock_guard<std::mutex> lock(m_callbackMutex);
    m_completionCallback = callback;
}

bool DownloadManager::isBusy() const {
    std::lock_guard<std::mutex> lock(m_downloadsMutex);
    
    for (const auto& info : m_downloads) {
        if (!info->isCompleted && !info->isFailed) {
            return true;
        }
    }
    
    return false;
}

double DownloadManager::getTotalProgress() const {
    std::lock_guard<std::mutex> lock(m_downloadsMutex);
    
    if (m_downloads.empty()) {
        return 0.0;
    }
    
    double totalProgress = 0.0;
    for (const auto& info : m_downloads) {
        totalProgress += info->progress;
    }
    
    return totalProgress / m_downloads.size();
}

void DownloadManager::workerThread() {
    while (m_running) {
        std::unique_lock<std::mutex> lock(m_queueMutex);
        m_queueCondition.wait(lock, [this] { return !m_downloadQueue.empty() || !m_running; });
        
        if (!m_running) {
            break;
        }
        
        if (!m_downloadQueue.empty()) {
            DownloadTask task = m_downloadQueue.front();
            m_downloadQueue.pop();
            lock.unlock();
            
            downloadFile(task);
        }
    }
}

bool DownloadManager::downloadFile(const DownloadTask& task) {
    try {
        std::string url = task.url;
        std::string protocol, host, path;
        int port = 80;

        if (url.find("https://") == 0) {
            protocol = "https";
            url = url.substr(8);
            port = 443;
        } else if (url.find("http://") == 0) {
            protocol = "http";
            url = url.substr(7);
            port = 80;
        } else {
            task.info->isFailed = true;
            task.info->errorMessage = "Unsupported protocol";
            return false;
        }

        size_t slashPos = url.find('/');
        host = (slashPos != std::string::npos) ? url.substr(0, slashPos) : url;
        path = (slashPos != std::string::npos) ? url.substr(slashPos) : "/";

        size_t colonPos = host.find(':');
        if (colonPos != std::string::npos) {
            port = std::stoi(host.substr(colonPos + 1));
            host = host.substr(0, colonPos);
        }

        std::filesystem::path destPath(task.destination);
        if (!std::filesystem::exists(destPath)) {
            std::filesystem::create_directories(destPath);
        }

        std::filesystem::path filePath = destPath / task.filename;
        size_t alreadyDownloaded = 0;

        // Resume: ถ้ามีไฟล์อยู่แล้ว ให้ต่อ
        if (std::filesystem::exists(filePath)) {
            alreadyDownloaded = std::filesystem::file_size(filePath);
        }

        std::ofstream file(filePath, std::ios::binary | std::ios::app);
        if (!file.is_open()) {
            task.info->isFailed = true;
            task.info->errorMessage = "Failed to create output file";
            return false;
        }

        httplib::Client client(host, port);
        client.set_follow_location(true);

        httplib::Headers headers;
        if (alreadyDownloaded > 0) {
            headers.emplace("Range", "bytes=" + std::to_string(alreadyDownloaded) + "-");
        }

        size_t downloaded = alreadyDownloaded;
        size_t total = 0;

        auto result = client.Get(path, headers,
            [&](const httplib::Response& res) {
                // Content-Length = ขนาดใหม่ที่เหลือ
                if (res.has_header("Content-Length")) {
                    total = std::stoull(res.get_header_value("Content-Length")) + alreadyDownloaded;
                }
                task.info->totalSize = total;
                return true;
            },
            [&](const char* data, size_t data_length) {
                file.write(data, data_length);
                downloaded += data_length;

                updateProgress(task.info, downloaded, total);
                return true;
            });

        file.close();

        if (!result || (result->status != 200 && result->status != 206)) {
            task.info->isFailed = true;
            task.info->errorMessage = result
                ? "HTTP error: " + std::to_string(result->status)
                : "Connection failed";
            return false;
        }

        task.info->isCompleted = true;
        task.info->progress = 1.0;

        std::lock_guard<std::mutex> lock(m_callbackMutex);
        if (m_completionCallback) {
            m_completionCallback(*task.info);
        }

        return true;
    }
    catch (const std::exception& e) {
        task.info->isFailed = true;
        task.info->errorMessage = "Exception: " + std::string(e.what());

        std::lock_guard<std::mutex> lock(m_callbackMutex);
        if (m_completionCallback) {
            m_completionCallback(*task.info);
        }
        return false;
    }
}

void DownloadManager::updateProgress(std::shared_ptr<DownloadInfo> info, size_t downloaded, size_t total) {
    info->totalSize = total;
    info->downloadedSize = downloaded;
    if (total > 0) {
        info->progress = static_cast<double>(downloaded) / static_cast<double>(total);
    }
    
    std::lock_guard<std::mutex> lock(m_callbackMutex);
    if (m_progressCallback) {
        m_progressCallback(*info);
    }
}

} // namespace launcher