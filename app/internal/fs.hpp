#pragma once

#include <string>
#include <vector>

namespace launcher {
namespace filesystem {

    // Structure to hold folder dialog result
    struct FolderDialogResult {
        bool success;
        bool cancelled;
        std::string path;
        std::string error;
    };

    // Structure to hold drive information
    struct DriveInfo {
        std::string letter;
        std::string label;
        std::string type;
        uint64_t totalSpace;
        uint64_t freeSpace;
    };

    // Show folder selection dialog
    FolderDialogResult ShowFolderDialog();

    // Get list of available drive letters with information
    std::vector<DriveInfo> GetDriveLetters();

    // Convert FolderDialogResult to JSON string
    std::string FolderDialogResultToJson(const FolderDialogResult& result);

    // Convert drive list to JSON string
    std::string DriveListToJson(const std::vector<DriveInfo>& drives);

} // namespace filesystem
} // namespace launcher