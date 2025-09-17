#pragma once

#include "include/cef_browser.h"
#include "include/cef_frame.h"
#include "gamemanager.hpp"
#include "downloadmanager.hpp"
#include <string>
#include <functional>
#include <map>
#include <memory>

namespace SimpleIPC {
    // Message handler callback type
    using MessageHandler = std::function<std::string(const std::string&)>;
    
    // IPC Handler class for ExecuteJavaScript-based communication
    class IPCHandler {
    public:
        IPCHandler();
        
        // Handle IPC call
        std::string HandleCall(const std::string& method, const std::string& message);
        
        // Register a message handler
        void RegisterHandler(const std::string& method, MessageHandler handler);
        
        // Get singleton instance
        static IPCHandler& GetInstance();
        
        // Public access to GameManager
        launcher::GameManager* getGameManager() { return &launcher::GameManager::getInstance(); }
        
        // Public access to DownloadManager
        launcher::DownloadManager* getDownloadManager() { return &downloadManager_; }
        
    private:
        std::map<std::string, MessageHandler> handlers_;
        launcher::DownloadManager downloadManager_;
    };
    
    // Initialize IPC system with ExecuteJavaScript
    void InitializeIPC(CefRefPtr<CefFrame> frame);
    
    // Test methods
    std::string HandlePing(const std::string& message);
    std::string HandleGetSystemInfo(const std::string& message);
    std::string HandleEcho(const std::string& message);
    
    // GameManager IPC methods
    std::string HandleGetGames(const std::string& message);
    std::string HandleLaunchGame(const std::string& message);
    std::string HandleScanSteamLibrary(const std::string& message);
    std::string HandleScanEpicLibrary(const std::string& message);
    
    // DownloadManager IPC methods
    std::string HandleStartDownload(const std::string& message);
    std::string HandleCancelDownload(const std::string& message);
    std::string HandleGetDownloadInfo(const std::string& message);
    std::string HandleGetAllDownloads(const std::string& message);
    
    // System dialog methods
    std::string HandleShowFolderDialog(const std::string& message);
}