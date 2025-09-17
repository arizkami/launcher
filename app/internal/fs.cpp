#include "fs.hpp"
#include <rapidjson/document.h>
#include <rapidjson/writer.h>
#include <rapidjson/stringbuffer.h>

#ifdef _WIN32
#include <windows.h>
#include <commdlg.h>
#include <shlobj.h>
#include <iostream>
#include <iomanip>
#include <sstream>
#endif

namespace launcher {
namespace filesystem {

    FolderDialogResult ShowFolderDialog() {
        FolderDialogResult result = {};
        
        try {
#ifdef _WIN32
            // Initialize COM
            HRESULT hr = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
            
            IFileOpenDialog* pFileOpen = nullptr;
            
            // Create the FileOpenDialog object
            hr = CoCreateInstance(CLSID_FileOpenDialog, NULL, CLSCTX_ALL, 
                                IID_IFileOpenDialog, reinterpret_cast<void**>(&pFileOpen));
            
            if (SUCCEEDED(hr)) {
                // Set options to pick folders only
                DWORD dwOptions;
                hr = pFileOpen->GetOptions(&dwOptions);
                if (SUCCEEDED(hr)) {
                    hr = pFileOpen->SetOptions(dwOptions | FOS_PICKFOLDERS);
                }
                
                // Show the dialog
                if (SUCCEEDED(hr)) {
                    hr = pFileOpen->Show(NULL);
                    
                    if (SUCCEEDED(hr)) {
                        // Get the result
                        IShellItem* pItem;
                        hr = pFileOpen->GetResult(&pItem);
                        if (SUCCEEDED(hr)) {
                            PWSTR pszFilePath;
                            hr = pItem->GetDisplayName(SIGDN_FILESYSPATH, &pszFilePath);
                            
                            if (SUCCEEDED(hr)) {
                                // Convert wide string to regular string
                                int size_needed = WideCharToMultiByte(CP_UTF8, 0, pszFilePath, -1, NULL, 0, NULL, NULL);
                                std::string folderPath(size_needed - 1, 0);
                                WideCharToMultiByte(CP_UTF8, 0, pszFilePath, -1, &folderPath[0], size_needed, NULL, NULL);
                                
                                result.success = true;
                                result.path = folderPath;
                                
                                CoTaskMemFree(pszFilePath);
                            }
                            pItem->Release();
                        }
                    } else if (hr == HRESULT_FROM_WIN32(ERROR_CANCELLED)) {
                        // User cancelled the dialog
                        result.success = false;
                        result.cancelled = true;
                    }
                }
                pFileOpen->Release();
            }
            
            CoUninitialize();
#else
            // For non-Windows platforms, return an error
            result.success = false;
            result.error = "Folder dialog not supported on this platform";
#endif
            
        } catch (const std::exception& e) {
            result.success = false;
            result.error = e.what();
        }
        
        return result;
    }

    std::vector<DriveInfo> GetDriveLetters() {
        std::vector<DriveInfo> drives;
        
#ifdef _WIN32
        // Get all logical drives
        DWORD drivesMask = GetLogicalDrives();
        
        for (int i = 0; i < 26; i++) {
            if (drivesMask & (1 << i)) {
                DriveInfo drive;
                drive.letter = std::string(1, 'A' + i) + ":";
                
                std::string rootPath = drive.letter + "\\";
                
                // Get drive type
                UINT driveType = GetDriveTypeA(rootPath.c_str());
                switch (driveType) {
                    case DRIVE_REMOVABLE:
                        drive.type = "Removable";
                        break;
                    case DRIVE_FIXED:
                        drive.type = "Fixed";
                        break;
                    case DRIVE_REMOTE:
                        drive.type = "Network";
                        break;
                    case DRIVE_CDROM:
                        drive.type = "CD-ROM";
                        break;
                    case DRIVE_RAMDISK:
                        drive.type = "RAM Disk";
                        break;
                    default:
                        drive.type = "Unknown";
                        break;
                }
                
                // Get volume label
                char volumeLabel[MAX_PATH + 1] = {0};
                DWORD serialNumber = 0;
                DWORD maxComponentLength = 0;
                DWORD fileSystemFlags = 0;
                char fileSystemName[MAX_PATH + 1] = {0};
                
                if (GetVolumeInformationA(rootPath.c_str(), volumeLabel, sizeof(volumeLabel),
                                        &serialNumber, &maxComponentLength, &fileSystemFlags,
                                        fileSystemName, sizeof(fileSystemName))) {
                    drive.label = std::string(volumeLabel);
                } else {
                    drive.label = "";
                }
                
                // Get disk space information
                ULARGE_INTEGER freeBytesAvailable;
                ULARGE_INTEGER totalNumberOfBytes;
                ULARGE_INTEGER totalNumberOfFreeBytes;
                
                if (GetDiskFreeSpaceExA(rootPath.c_str(), &freeBytesAvailable, 
                                      &totalNumberOfBytes, &totalNumberOfFreeBytes)) {
                    drive.totalSpace = totalNumberOfBytes.QuadPart;
                    drive.freeSpace = freeBytesAvailable.QuadPart;
                } else {
                    drive.totalSpace = 0;
                    drive.freeSpace = 0;
                }
                
                drives.push_back(drive);
            }
        }
#endif
        
        return drives;
    }

    std::string FolderDialogResultToJson(const FolderDialogResult& result) {
        rapidjson::Document response;
        response.SetObject();
        auto& allocator = response.GetAllocator();
        
        response.AddMember("success", result.success, allocator);
        
        if (result.cancelled) {
            response.AddMember("cancelled", true, allocator);
        }
        
        if (!result.path.empty()) {
            response.AddMember("path", rapidjson::Value(result.path.c_str(), allocator), allocator);
        }
        
        if (!result.error.empty()) {
            response.AddMember("error", rapidjson::Value(result.error.c_str(), allocator), allocator);
        }
        
        rapidjson::StringBuffer buffer;
        rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
        response.Accept(writer);
        return buffer.GetString();
    }

    std::string DriveListToJson(const std::vector<DriveInfo>& drives) {
        rapidjson::Document response;
        response.SetObject();
        auto& allocator = response.GetAllocator();
        
        rapidjson::Value driveArray(rapidjson::kArrayType);
        
        for (const auto& drive : drives) {
            rapidjson::Value driveObj(rapidjson::kObjectType);
            
            driveObj.AddMember("letter", rapidjson::Value(drive.letter.c_str(), allocator), allocator);
            driveObj.AddMember("label", rapidjson::Value(drive.label.c_str(), allocator), allocator);
            driveObj.AddMember("type", rapidjson::Value(drive.type.c_str(), allocator), allocator);
            driveObj.AddMember("totalSpace", drive.totalSpace, allocator);
            driveObj.AddMember("freeSpace", drive.freeSpace, allocator);
            
            driveArray.PushBack(driveObj, allocator);
        }
        
        response.AddMember("success", true, allocator);
        response.AddMember("drives", driveArray, allocator);
        
        rapidjson::StringBuffer buffer;
        rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
        response.Accept(writer);
        return buffer.GetString();
    }

} // namespace filesystem
} // namespace launcher