#include "ipc.hpp"
#include "include/cef_version.h"
#include <sstream>
#include <chrono>
#include <ctime>
#include <rapidjson/document.h>
#include <rapidjson/writer.h>
#include <rapidjson/stringbuffer.h>

namespace SimpleIPC {
    
    IPCHandler::IPCHandler() {
        // Register default handlers
        RegisterHandler("ping", HandlePing);
        RegisterHandler("getSystemInfo", HandleGetSystemInfo);
        RegisterHandler("echo", HandleEcho);
        
        // Register GameManager handlers
        RegisterHandler("getGames", HandleGetGames);
        RegisterHandler("launchGame", HandleLaunchGame);
        RegisterHandler("scanSteamLibrary", HandleScanSteamLibrary);
        RegisterHandler("scanEpicLibrary", HandleScanEpicLibrary);
        
        // Register DownloadManager handlers
        RegisterHandler("startDownload", HandleStartDownload);
        RegisterHandler("cancelDownload", HandleCancelDownload);
        RegisterHandler("getDownloadInfo", HandleGetDownloadInfo);
        RegisterHandler("getAllDownloads", HandleGetAllDownloads);
        
        // Register system dialog handlers
        RegisterHandler("showFolderDialog", HandleShowFolderDialog);
        RegisterHandler("getDriveLetters", HandleGetDriveLetters);
    }
    
    std::string IPCHandler::HandleCall(const std::string& method, const std::string& message) {
        auto it = handlers_.find(method);
        if (it != handlers_.end()) {
            try {
                return it->second(message);
            } catch (const std::exception& e) {
                return "Error: " + std::string(e.what());
            }
        } else {
            return "Error: Unknown method: " + method;
        }
    }
    
    void IPCHandler::RegisterHandler(const std::string& method, MessageHandler handler) {
        handlers_[method] = handler;
    }
    
    IPCHandler& IPCHandler::GetInstance() {
        static IPCHandler instance;
        return instance;
    }
    
    void InitializeIPC(CefRefPtr<CefFrame> frame) {
        if (!frame.get()) return;
        
        // Inject JavaScript code to create the nativeAPI object
        std::string js_code = R"(
            window.nativeAPI = {
                call: function(method, message) {
                    // This will be handled by cefQuery in the browser process
                    return new Promise(function(resolve, reject) {
                        if (window.cefQuery) {
                            window.cefQuery({
                                request: 'ipc_call:' + method + ':' + (message || ''),
                                onSuccess: function(response) {
                                    resolve(response);
                                },
                                onFailure: function(error_code, error_message) {
                                    reject(new Error(error_message));
                                }
                            });
                        } else {
                            reject(new Error('CEF Query not available'));
                        }
                    });
                }
            };
        )";
        
        frame->ExecuteJavaScript(js_code, frame->GetURL(), 0);
    }
    
    std::string HandlePing(const std::string& message) {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        
        std::stringstream ss;
        ss << "Pong! Server time: " << std::ctime(&time_t);
        std::string result = ss.str();
        
        // Remove trailing newline
        if (!result.empty() && result.back() == '\n') {
            result.pop_back();
        }
        
        return result;
    }
    
    std::string HandleGetSystemInfo(const std::string& message) {
        std::stringstream ss;
        ss << "{";
        ss << "\"platform\": \"Windows\",";
        ss << "\"cef_version\": \"" << CEF_VERSION << "\",";
        ss << "\"timestamp\": \"" << std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count() << "\"";
        ss << "}";
        
        return ss.str();
    }
    
    std::string HandleEcho(const std::string& message) {
        return "Echo: " + message;
    }
    
    std::string HandleGetGames(const std::string& message) {
        try {
            auto& handler = IPCHandler::GetInstance();
            auto games = handler.getGameManager()->getGames();
            
            // Convert games to JSON string
            std::string result = "[";
            for (size_t i = 0; i < games.size(); ++i) {
                if (i > 0) result += ",";
                result += games[i].toJson();
            }
            result += "]";
            
            return result;
            
        } catch (const std::exception& e) {
            return "{\"error\": \"" + std::string(e.what()) + "\"}";
        }
    }
    
    std::string HandleStartDownload(const std::string& message) {
        try {
            rapidjson::Document json;
            json.Parse(message.c_str());
            
            if (json.HasParseError()) {
                rapidjson::Document response;
                response.SetObject();
                auto& allocator = response.GetAllocator();
                response.AddMember("success", false, allocator);
                response.AddMember("error", "Invalid JSON", allocator);
                
                rapidjson::StringBuffer buffer;
                rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
                response.Accept(writer);
                return buffer.GetString();
            }
            
            std::string url = json["url"].GetString();
            std::string destination = json["destination"].GetString();
            std::string filename = json.HasMember("filename") ? json["filename"].GetString() : "";
            
            auto& handler = IPCHandler::GetInstance();
            int downloadId = handler.getDownloadManager()->startDownload(url, destination, filename);
            
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", true, allocator);
            response.AddMember("downloadId", downloadId, allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", false, allocator);
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }
    
    std::string HandleCancelDownload(const std::string& message) {
        try {
            rapidjson::Document json;
            json.Parse(message.c_str());
            
            if (json.HasParseError()) {
                rapidjson::Document response;
                response.SetObject();
                auto& allocator = response.GetAllocator();
                response.AddMember("success", false, allocator);
                response.AddMember("error", "Invalid JSON", allocator);
                
                rapidjson::StringBuffer buffer;
                rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
                response.Accept(writer);
                return buffer.GetString();
            }
            
            int downloadId = json["downloadId"].GetInt();
            
            auto& handler = IPCHandler::GetInstance();
            bool success = handler.getDownloadManager()->cancelDownload(downloadId);
            
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", success, allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", false, allocator);
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }
    
    std::string HandleGetDownloadInfo(const std::string& message) {
        try {
            rapidjson::Document json;
            json.Parse(message.c_str());
            
            if (json.HasParseError()) {
                rapidjson::Document response;
                response.SetObject();
                auto& allocator = response.GetAllocator();
                response.AddMember("success", false, allocator);
                response.AddMember("error", "Invalid JSON", allocator);
                
                rapidjson::StringBuffer buffer;
                rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
                response.Accept(writer);
                return buffer.GetString();
            }
            
            int downloadId = json["downloadId"].GetInt();
            
            auto& handler = IPCHandler::GetInstance();
            auto info = handler.getDownloadManager()->getDownloadInfo(downloadId);
            
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", true, allocator);
            
            rapidjson::Value downloadInfo(rapidjson::kObjectType);
            downloadInfo.AddMember("url", rapidjson::Value(info.url.c_str(), allocator), allocator);
            downloadInfo.AddMember("destination", rapidjson::Value(info.destination.c_str(), allocator), allocator);
            downloadInfo.AddMember("filename", rapidjson::Value(info.filename.c_str(), allocator), allocator);
            downloadInfo.AddMember("totalSize", info.totalSize, allocator);
            downloadInfo.AddMember("downloadedSize", info.downloadedSize, allocator);
            downloadInfo.AddMember("progress", info.progress, allocator);
            downloadInfo.AddMember("isCompleted", info.isCompleted, allocator);
            downloadInfo.AddMember("isFailed", info.isFailed, allocator);
            downloadInfo.AddMember("errorMessage", rapidjson::Value(info.errorMessage.c_str(), allocator), allocator);
            downloadInfo.AddMember("downloadId", info.downloadId, allocator);
            
            response.AddMember("downloadInfo", downloadInfo, allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", false, allocator);
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }
    
    std::string HandleGetAllDownloads(const std::string& message) {
        try {
            auto& handler = IPCHandler::GetInstance();
            auto downloads = handler.getDownloadManager()->getAllDownloads();
            
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", true, allocator);
            
            rapidjson::Value downloadsArray(rapidjson::kArrayType);
            
            for (const auto& info : downloads) {
                rapidjson::Value downloadJson(rapidjson::kObjectType);
                downloadJson.AddMember("url", rapidjson::Value(info.url.c_str(), allocator), allocator);
                downloadJson.AddMember("destination", rapidjson::Value(info.destination.c_str(), allocator), allocator);
                downloadJson.AddMember("filename", rapidjson::Value(info.filename.c_str(), allocator), allocator);
                downloadJson.AddMember("totalSize", info.totalSize, allocator);
                downloadJson.AddMember("downloadedSize", info.downloadedSize, allocator);
                downloadJson.AddMember("progress", info.progress, allocator);
                downloadJson.AddMember("isCompleted", info.isCompleted, allocator);
                downloadJson.AddMember("isFailed", info.isFailed, allocator);
                downloadJson.AddMember("errorMessage", rapidjson::Value(info.errorMessage.c_str(), allocator), allocator);
                downloadJson.AddMember("downloadId", info.downloadId, allocator);
                
                downloadsArray.PushBack(downloadJson, allocator);
            }
            
            response.AddMember("downloads", downloadsArray, allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", false, allocator);
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }
    
    std::string HandleLaunchGame(const std::string& message) {
        try {
            auto& handler = IPCHandler::GetInstance();
            
            // Parse JSON message to extract game ID and platform
            // For now, assume message format: "platform:gameId"
            size_t colonPos = message.find(':');
            if (colonPos == std::string::npos) {
                rapidjson::Document response;
                response.SetObject();
                auto& allocator = response.GetAllocator();
                response.AddMember("error", "Invalid message format. Expected 'platform:gameId'", allocator);
                
                rapidjson::StringBuffer buffer;
                rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
                response.Accept(writer);
                return buffer.GetString();
            }
            
            std::string platform = message.substr(0, colonPos);
            std::string gameId = message.substr(colonPos + 1);
            
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            
            if (platform == "steam") {
                bool success = handler.getGameManager()->launchSteamGame(gameId);
                if (success) {
                    response.AddMember("success", true, allocator);
                } else {
                    response.AddMember("error", "Failed to launch Steam game", allocator);
                }
            } else if (platform == "epic") {
                bool success = handler.getGameManager()->launchEpicGame(gameId);
                if (success) {
                    response.AddMember("success", true, allocator);
                } else {
                    response.AddMember("error", "Failed to launch Epic game", allocator);
                }
            } else {
                bool success = handler.getGameManager()->launchGame(gameId);
                if (success) {
                    response.AddMember("success", true, allocator);
                } else {
                    response.AddMember("error", "Failed to launch game", allocator);
                }
            }
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }
    
    std::string HandleScanSteamLibrary(const std::string& message) {
        try {
            auto& handler = IPCHandler::GetInstance();
            auto steamGames = handler.getGameManager()->scanSteamLibrary();
            
            // Convert Steam games to JSON string
            std::string result = "[";
            for (size_t i = 0; i < steamGames.size(); ++i) {
                if (i > 0) result += ",";
                result += steamGames[i].toJson();
            }
            result += "]";
            
            return result;
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }
    
    std::string HandleScanEpicLibrary(const std::string& message) {
        try {
            auto& handler = IPCHandler::GetInstance();
            auto epicGames = handler.getGameManager()->scanEpicLibrary();
            
            // Convert Epic games to JSON string
            std::string result = "[";
            for (size_t i = 0; i < epicGames.size(); ++i) {
                if (i > 0) result += ",";
                result += epicGames[i].toJson();
            }
            result += "]";
            
            return result;
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }
    
    std::string HandleShowFolderDialog(const std::string& message) {
        try {
            auto result = launcher::filesystem::ShowFolderDialog();
            return launcher::filesystem::FolderDialogResultToJson(result);
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", false, allocator);
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }

    std::string HandleGetDriveLetters(const std::string& message) {
        try {
            auto drives = launcher::filesystem::GetDriveLetters();
            return launcher::filesystem::DriveListToJson(drives);
        } catch (const std::exception& e) {
            rapidjson::Document response;
            response.SetObject();
            auto& allocator = response.GetAllocator();
            response.AddMember("success", false, allocator);
            response.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            response.Accept(writer);
            return buffer.GetString();
        }
    }

}