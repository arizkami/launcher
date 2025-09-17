#include "gamemanager.hpp"
#include <fstream>
#include <sstream>
#include <filesystem>
#include <random>
#include <iomanip>
#include <windows.h>
#include <shellapi.h>
#include <rapidjson/prettywriter.h>
#include <rapidjson/error/en.h>

namespace launcher {

// Game struct implementations
std::string Game::toJson() const {
    rapidjson::Document doc;
    doc.SetObject();
    auto& allocator = doc.GetAllocator();

    doc.AddMember("id", rapidjson::Value(id.c_str(), allocator), allocator);
    doc.AddMember("name", rapidjson::Value(name.c_str(), allocator), allocator);
    
    std::string typeStr;
    switch (type) {
        case GameType::EXECUTABLE: typeStr = "exe"; break;
        case GameType::STEAM: typeStr = "steam"; break;
        case GameType::EPIC: typeStr = "epic"; break;
    }
    doc.AddMember("type", rapidjson::Value(typeStr.c_str(), allocator), allocator);
    
    if (path.has_value()) {
        doc.AddMember("path", rapidjson::Value(path->c_str(), allocator), allocator);
    }
    if (steamId.has_value()) {
        doc.AddMember("steamId", rapidjson::Value(steamId->c_str(), allocator), allocator);
    }
    if (epicId.has_value()) {
        doc.AddMember("epicId", rapidjson::Value(epicId->c_str(), allocator), allocator);
    }
    if (icon.has_value()) {
        doc.AddMember("icon", rapidjson::Value(icon->c_str(), allocator), allocator);
    }
    if (banner.has_value()) {
        doc.AddMember("banner", rapidjson::Value(banner->c_str(), allocator), allocator);
    }
    if (playtime.has_value()) {
        doc.AddMember("playtime", rapidjson::Value(*playtime), allocator);
    }
    
    doc.AddMember("installed", rapidjson::Value(installed), allocator);
    
    if (lastPlayed.has_value()) {
        auto time_t = std::chrono::system_clock::to_time_t(*lastPlayed);
        std::stringstream ss;
        ss << std::put_time(std::gmtime(&time_t), "%Y-%m-%dT%H:%M:%SZ");
        doc.AddMember("lastPlayed", rapidjson::Value(ss.str().c_str(), allocator), allocator);
    }

    rapidjson::StringBuffer buffer;
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    doc.Accept(writer);
    return buffer.GetString();
}

Game Game::fromJson(const std::string& json) {
    rapidjson::Document doc;
    doc.Parse(json.c_str());
    
    if (doc.HasParseError()) {
        throw std::runtime_error("Failed to parse Game JSON");
    }

    Game game;
    game.id = doc["id"].GetString();
    game.name = doc["name"].GetString();
    
    std::string typeStr = doc["type"].GetString();
    if (typeStr == "exe") game.type = GameType::EXECUTABLE;
    else if (typeStr == "steam") game.type = GameType::STEAM;
    else if (typeStr == "epic") game.type = GameType::EPIC;
    
    if (doc.HasMember("path") && !doc["path"].IsNull()) {
        game.path = doc["path"].GetString();
    }
    if (doc.HasMember("steamId") && !doc["steamId"].IsNull()) {
        game.steamId = doc["steamId"].GetString();
    }
    if (doc.HasMember("epicId") && !doc["epicId"].IsNull()) {
        game.epicId = doc["epicId"].GetString();
    }
    if (doc.HasMember("icon") && !doc["icon"].IsNull()) {
        game.icon = doc["icon"].GetString();
    }
    if (doc.HasMember("banner") && !doc["banner"].IsNull()) {
        game.banner = doc["banner"].GetString();
    }
    if (doc.HasMember("playtime") && !doc["playtime"].IsNull()) {
        game.playtime = doc["playtime"].GetInt();
    }
    
    game.installed = doc["installed"].GetBool();
    
    if (doc.HasMember("lastPlayed") && !doc["lastPlayed"].IsNull()) {
        std::string timeStr = doc["lastPlayed"].GetString();
        std::tm tm = {};
        std::istringstream ss(timeStr);
        ss >> std::get_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
        game.lastPlayed = std::chrono::system_clock::from_time_t(std::mktime(&tm));
    }
    
    return game;
}

// SteamGame struct implementations
std::string SteamGame::toJson() const {
    rapidjson::Document doc;
    doc.SetObject();
    auto& allocator = doc.GetAllocator();

    doc.AddMember("appid", rapidjson::Value(appid.c_str(), allocator), allocator);
    doc.AddMember("name", rapidjson::Value(name.c_str(), allocator), allocator);
    doc.AddMember("installed", rapidjson::Value(installed), allocator);
    
    if (path.has_value()) {
        doc.AddMember("path", rapidjson::Value(path->c_str(), allocator), allocator);
    }

    rapidjson::StringBuffer buffer;
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    doc.Accept(writer);
    return buffer.GetString();
}

SteamGame SteamGame::fromJson(const std::string& json) {
    rapidjson::Document doc;
    doc.Parse(json.c_str());
    
    if (doc.HasParseError()) {
        throw std::runtime_error("Failed to parse SteamGame JSON");
    }

    SteamGame game;
    game.appid = doc["appid"].GetString();
    game.name = doc["name"].GetString();
    game.installed = doc["installed"].GetBool();
    
    if (doc.HasMember("path") && !doc["path"].IsNull()) {
        game.path = doc["path"].GetString();
    }
    
    return game;
}

// EpicGame struct implementations
std::string EpicGame::toJson() const {
    rapidjson::Document doc;
    doc.SetObject();
    auto& allocator = doc.GetAllocator();

    doc.AddMember("catalogItemId", rapidjson::Value(catalogItemId.c_str(), allocator), allocator);
    doc.AddMember("displayName", rapidjson::Value(displayName.c_str(), allocator), allocator);
    doc.AddMember("installed", rapidjson::Value(installed), allocator);
    
    if (installLocation.has_value()) {
        doc.AddMember("installLocation", rapidjson::Value(installLocation->c_str(), allocator), allocator);
    }

    rapidjson::StringBuffer buffer;
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    doc.Accept(writer);
    return buffer.GetString();
}

EpicGame EpicGame::fromJson(const std::string& json) {
    rapidjson::Document doc;
    doc.Parse(json.c_str());
    
    if (doc.HasParseError()) {
        throw std::runtime_error("Failed to parse EpicGame JSON");
    }

    EpicGame game;
    game.catalogItemId = doc["catalogItemId"].GetString();
    game.displayName = doc["displayName"].GetString();
    game.installed = doc["installed"].GetBool();
    
    if (doc.HasMember("installLocation") && !doc["installLocation"].IsNull()) {
        game.installLocation = doc["installLocation"].GetString();
    }
    
    return game;
}

// GameManager implementations
GameManager& GameManager::getInstance() {
    static GameManager instance;
    return instance;
}

std::string GameManager::getGamesFilePath() const {
    char* appDataPath;
    size_t len;
    _dupenv_s(&appDataPath, &len, "APPDATA");
    
    std::filesystem::path gamesPath = std::filesystem::path(appDataPath) / "launcher" / "games.json";
    free(appDataPath);
    
    // Create directory if it doesn't exist
    std::filesystem::create_directories(gamesPath.parent_path());
    
    return gamesPath.string();
}

std::string GameManager::generateGameId() const {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    
    std::stringstream ss;
    ss << std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    
    for (int i = 0; i < 8; ++i) {
        ss << std::hex << dis(gen);
    }
    
    return ss.str();
}

std::vector<Game> GameManager::loadGames() {
    std::string filePath = getGamesFilePath();
    
    if (!std::filesystem::exists(filePath)) {
        games_.clear();
        return games_;
    }
    
    std::ifstream file(filePath);
    if (!file.is_open()) {
        games_.clear();
        return games_;
    }
    
    std::stringstream buffer;
    buffer << file.rdbuf();
    file.close();
    
    try {
        rapidjson::Document doc;
        doc.Parse(buffer.str().c_str());
        
        if (doc.HasParseError() || !doc.IsArray()) {
            games_.clear();
            return games_;
        }
        
        games_.clear();
        for (const auto& gameJson : doc.GetArray()) {
            rapidjson::StringBuffer gameBuffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(gameBuffer);
            gameJson.Accept(writer);
            
            try {
                games_.push_back(Game::fromJson(gameBuffer.GetString()));
            } catch (const std::exception&) {
                // Skip invalid game entries
                continue;
            }
        }
    } catch (const std::exception&) {
        games_.clear();
    }
    
    return games_;
}

void GameManager::saveGames() {
    std::string filePath = getGamesFilePath();
    
    rapidjson::Document doc;
    doc.SetArray();
    auto& allocator = doc.GetAllocator();
    
    for (const auto& game : games_) {
        rapidjson::Document gameDoc;
        gameDoc.Parse(game.toJson().c_str());
        doc.PushBack(gameDoc, allocator);
    }
    
    std::ofstream file(filePath);
    if (file.is_open()) {
        rapidjson::StringBuffer buffer;
        rapidjson::PrettyWriter<rapidjson::StringBuffer> writer(buffer);
        doc.Accept(writer);
        file << buffer.GetString();
        file.close();
    }
}

Game GameManager::addGame(const Game& game) {
    Game newGame = game;
    newGame.id = generateGameId();
    games_.push_back(newGame);
    saveGames();
    return newGame;
}

bool GameManager::removeGame(const std::string& gameId) {
    auto it = std::find_if(games_.begin(), games_.end(),
        [&gameId](const Game& game) { return game.id == gameId; });
    
    if (it != games_.end()) {
        games_.erase(it);
        saveGames();
        return true;
    }
    return false;
}

std::optional<Game> GameManager::updateGame(const std::string& gameId, const Game& updates) {
    auto it = std::find_if(games_.begin(), games_.end(),
        [&gameId](const Game& game) { return game.id == gameId; });
    
    if (it != games_.end()) {
        // Update fields while preserving the ID
        std::string originalId = it->id;
        *it = updates;
        it->id = originalId;
        saveGames();
        return *it;
    }
    return std::nullopt;
}

std::vector<Game> GameManager::getGames() const {
    return games_;
}

std::optional<Game> GameManager::addExecutable(const std::string& filePath) {
    if (!std::filesystem::exists(filePath)) {
        return std::nullopt;
    }
    
    std::filesystem::path path(filePath);
    std::string fileName = path.stem().string();
    
    Game game;
    game.name = fileName;
    game.type = GameType::EXECUTABLE;
    game.path = filePath;
    game.installed = true;
    game.playtime = 0;
    
    return addGame(game);
}

bool GameManager::launchExecutable(const std::string& path) {
    if (!std::filesystem::exists(path)) {
        return false;
    }
    
    SHELLEXECUTEINFOA sei = {};
    sei.cbSize = sizeof(sei);
    sei.fMask = SEE_MASK_NOCLOSEPROCESS;
    sei.lpVerb = "open";
    sei.lpFile = path.c_str();
    sei.nShow = SW_SHOWNORMAL;
    
    return ShellExecuteExA(&sei) != FALSE;
}

bool GameManager::launchSteamGame(const std::string& steamId) {
    std::string steamUrl = "steam://rungameid/" + steamId;
    
    SHELLEXECUTEINFOA sei = {};
    sei.cbSize = sizeof(sei);
    sei.fMask = SEE_MASK_NOCLOSEPROCESS;
    sei.lpVerb = "open";
    sei.lpFile = steamUrl.c_str();
    sei.nShow = SW_SHOWNORMAL;
    
    return ShellExecuteExA(&sei) != FALSE;
}

bool GameManager::launchEpicGame(const std::string& epicId) {
    std::string epicUrl = "com.epicgames.launcher://apps/" + epicId + "?action=launch&silent=true";
    
    SHELLEXECUTEINFOA sei = {};
    sei.cbSize = sizeof(sei);
    sei.fMask = SEE_MASK_NOCLOSEPROCESS;
    sei.lpVerb = "open";
    sei.lpFile = epicUrl.c_str();
    sei.nShow = SW_SHOWNORMAL;
    
    return ShellExecuteExA(&sei) != FALSE;
}

bool GameManager::launchGame(const std::string& gameId) {
    auto it = std::find_if(games_.begin(), games_.end(),
        [&gameId](const Game& game) { return game.id == gameId; });
    
    if (it == games_.end()) {
        return false;
    }
    
    bool success = false;
    switch (it->type) {
        case GameType::EXECUTABLE:
            if (it->path.has_value()) {
                success = launchExecutable(*it->path);
            }
            break;
        case GameType::STEAM:
            if (it->steamId.has_value()) {
                success = launchSteamGame(*it->steamId);
            }
            break;
        case GameType::EPIC:
            if (it->epicId.has_value()) {
                success = launchEpicGame(*it->epicId);
            }
            break;
    }
    
    if (success) {
        // Update last played time
        Game updatedGame = *it;
        updatedGame.lastPlayed = std::chrono::system_clock::now();
        updateGame(gameId, updatedGame);
    }
    
    return success;
}

std::string GameManager::handleCefQuery(const std::string& request) {
    try {
        rapidjson::Document doc;
        doc.Parse(request.c_str());
        
        if (doc.HasParseError() || !doc.HasMember("action")) {
            rapidjson::Document errorDoc;
            errorDoc.SetObject();
            auto& allocator = errorDoc.GetAllocator();
            errorDoc.AddMember("success", false, allocator);
            errorDoc.AddMember("error", "Invalid request format", allocator);
            
            rapidjson::StringBuffer buffer;
            rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
            errorDoc.Accept(writer);
            return buffer.GetString();
        }
        
        std::string action = doc["action"].GetString();
        
        rapidjson::Document response;
        response.SetObject();
        auto& allocator = response.GetAllocator();
        
        if (action == "scan_steam_library") {
            auto steamGames = scanSteamLibrary();
            
            rapidjson::Value gamesArray(rapidjson::kArrayType);
            for (const auto& game : steamGames) {
                rapidjson::Document gameDoc;
                gameDoc.Parse(game.toJson().c_str());
                gamesArray.PushBack(gameDoc, allocator);
            }
            
            response.AddMember("success", true, allocator);
            response.AddMember("games", gamesArray, allocator);
            
        } else if (action == "scan_epic_library") {
            auto epicGames = scanEpicLibrary();
            
            rapidjson::Value gamesArray(rapidjson::kArrayType);
            for (const auto& game : epicGames) {
                rapidjson::Document gameDoc;
                gameDoc.Parse(game.toJson().c_str());
                gamesArray.PushBack(gameDoc, allocator);
            }
            
            response.AddMember("success", true, allocator);
            response.AddMember("games", gamesArray, allocator);
            
        } else if (action == "launch_game") {
            if (!doc.HasMember("gameId")) {
                response.AddMember("success", false, allocator);
                response.AddMember("error", "Missing gameId", allocator);
            } else {
                std::string gameId = doc["gameId"].GetString();
                bool success = launchGame(gameId);
                response.AddMember("success", success, allocator);
                if (!success) {
                    response.AddMember("error", "Failed to launch game", allocator);
                }
            }
            
        } else {
            response.AddMember("success", false, allocator);
            response.AddMember("error", "Unknown action", allocator);
        }
        
        rapidjson::StringBuffer buffer;
        rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
        response.Accept(writer);
        return buffer.GetString();
        
    } catch (const std::exception& e) {
        rapidjson::Document errorDoc;
        errorDoc.SetObject();
        auto& allocator = errorDoc.GetAllocator();
        errorDoc.AddMember("success", false, allocator);
        errorDoc.AddMember("error", rapidjson::Value(e.what(), allocator), allocator);
        
        rapidjson::StringBuffer buffer;
        rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
        errorDoc.Accept(writer);
        return buffer.GetString();
    }
}

std::vector<SteamGame> GameManager::scanSteamLibrary() {
    std::vector<SteamGame> steamGames;
    
    try {
        // Get Steam installation path from registry
        HKEY hKey;
        char steamPath[MAX_PATH] = {0};
        DWORD bufferSize = sizeof(steamPath);
        
        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\WOW6432Node\\Valve\\Steam", 0, KEY_READ, &hKey) == ERROR_SUCCESS ||
            RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Valve\\Steam", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            
            if (RegQueryValueExA(hKey, "InstallPath", NULL, NULL, (LPBYTE)steamPath, &bufferSize) == ERROR_SUCCESS) {
                RegCloseKey(hKey);
                
                // Parse Steam library folders
                std::filesystem::path steamConfigPath = std::filesystem::path(steamPath) / "config" / "libraryfolders.vdf";
                
                if (std::filesystem::exists(steamConfigPath)) {
                    std::ifstream file(steamConfigPath);
                    std::string line;
                    std::vector<std::string> libraryPaths;
                    
                    // Add default Steam library path
                    libraryPaths.push_back(std::string(steamPath) + "\\steamapps");
                    
                    // Parse additional library paths from libraryfolders.vdf
                    while (std::getline(file, line)) {
                        if (line.find("\"path\"") != std::string::npos) {
                            size_t start = line.find("\"", line.find("\"path\"") + 6) + 1;
                            size_t end = line.find("\"", start);
                            if (start != std::string::npos && end != std::string::npos) {
                                std::string path = line.substr(start, end - start);
                                // Replace double backslashes with single backslashes
                                std::string::size_type pos = 0;
                                while ((pos = path.find("\\\\", pos)) != std::string::npos) {
                                    path.replace(pos, 2, "\\");
                                    pos += 1;
                                }
                                libraryPaths.push_back(path + "\\steamapps");
                            }
                        }
                    }
                    file.close();
                    
                    // Scan each library path for installed games
                    for (const auto& libraryPath : libraryPaths) {
                        std::filesystem::path appcachePath = std::filesystem::path(libraryPath) / "appmanifest_*.acf";
                        
                        // Use Windows API to find appmanifest files
                        WIN32_FIND_DATAA findData;
                        std::string searchPattern = libraryPath + "\\appmanifest_*.acf";
                        HANDLE hFind = FindFirstFileA(searchPattern.c_str(), &findData);
                        
                        if (hFind != INVALID_HANDLE_VALUE) {
                            do {
                                std::string manifestPath = libraryPath + "\\" + findData.cFileName;
                                
                                // Parse ACF file
                                std::ifstream acfFile(manifestPath);
                                if (acfFile.is_open()) {
                                    std::string acfLine;
                                    SteamGame game;
                                    bool foundAppId = false, foundName = false, foundInstallDir = false;
                                    
                                    while (std::getline(acfFile, acfLine) && (!foundAppId || !foundName || !foundInstallDir)) {
                                        // Remove tabs and extra spaces
                                        acfLine.erase(0, acfLine.find_first_not_of(" \t"));
                                        
                                        if (acfLine.find("\"appid\"") == 0) {
                                            size_t start = acfLine.find("\"", 8) + 1;
                                            size_t end = acfLine.find("\"", start);
                                            if (start != std::string::npos && end != std::string::npos) {
                                                game.appid = acfLine.substr(start, end - start);
                                                foundAppId = true;
                                            }
                                        }
                                        else if (acfLine.find("\"name\"") == 0) {
                                            size_t start = acfLine.find("\"", 7) + 1;
                                            size_t end = acfLine.find("\"", start);
                                            if (start != std::string::npos && end != std::string::npos) {
                                                game.name = acfLine.substr(start, end - start);
                                                foundName = true;
                                            }
                                        }
                                        else if (acfLine.find("\"installdir\"") == 0) {
                                            size_t start = acfLine.find("\"", 12) + 1;
                                            size_t end = acfLine.find("\"", start);
                                            if (start != std::string::npos && end != std::string::npos) {
                                                std::string installDir = acfLine.substr(start, end - start);
                                                game.path = libraryPath + "\\common\\" + installDir;
                                                foundInstallDir = true;
                                            }
                                        }
                                    }
                                    acfFile.close();
                                    
                                    if (foundAppId && foundName) {
                                        game.installed = foundInstallDir && std::filesystem::exists(*game.path);
                                        steamGames.push_back(game);
                                    }
                                }
                            } while (FindNextFileA(hFind, &findData));
                            FindClose(hFind);
                        }
                    }
                }
            } else {
                RegCloseKey(hKey);
            }
        }
    } catch (const std::exception&) {
        // Return empty vector on any error
    }
    
    return steamGames;
}

std::vector<EpicGame> GameManager::scanEpicLibrary() {
    std::vector<EpicGame> epicGames;
    
    try {
        // Get Epic Games Launcher data path
        char* localAppDataPath;
        size_t len;
        _dupenv_s(&localAppDataPath, &len, "LOCALAPPDATA");
        
        if (localAppDataPath) {
            std::filesystem::path epicDataPath = std::filesystem::path(localAppDataPath) / "EpicGamesLauncher" / "Saved" / "Config" / "Windows" / "GameUserSettings.ini";
            std::filesystem::path manifestsPath = std::filesystem::path(localAppDataPath) / "EpicGamesLauncher" / "Saved" / "Logs";
            
            // Try alternative path for manifests
            std::filesystem::path programDataPath;
            char* programData;
            _dupenv_s(&programData, &len, "PROGRAMDATA");
            if (programData) {
                manifestsPath = std::filesystem::path(programData) / "Epic" / "EpicGamesLauncher" / "Data" / "Manifests";
                free(programData);
            }
            
            free(localAppDataPath);
            
            // Scan manifest files
            if (std::filesystem::exists(manifestsPath)) {
                try {
                    for (const auto& entry : std::filesystem::directory_iterator(manifestsPath)) {
                        if (entry.is_regular_file() && entry.path().extension() == ".item") {
                            std::ifstream manifestFile(entry.path());
                            if (manifestFile.is_open()) {
                                std::stringstream buffer;
                                buffer << manifestFile.rdbuf();
                                manifestFile.close();
                                
                                std::string manifestContent = buffer.str();
                                
                                // Parse JSON manifest
                                rapidjson::Document doc;
                                doc.Parse(manifestContent.c_str());
                                
                                if (!doc.HasParseError() && doc.IsObject()) {
                                    EpicGame game;
                                    bool hasRequiredFields = false;
                                    
                                    if (doc.HasMember("CatalogItemId") && doc["CatalogItemId"].IsString()) {
                                        game.catalogItemId = doc["CatalogItemId"].GetString();
                                        hasRequiredFields = true;
                                    }
                                    
                                    if (doc.HasMember("DisplayName") && doc["DisplayName"].IsString()) {
                                        game.displayName = doc["DisplayName"].GetString();
                                    } else if (doc.HasMember("AppName") && doc["AppName"].IsString()) {
                                        game.displayName = doc["AppName"].GetString();
                                    }
                                    
                                    if (doc.HasMember("InstallLocation") && doc["InstallLocation"].IsString()) {
                                        std::string installLoc = doc["InstallLocation"].GetString();
                                        if (!installLoc.empty() && std::filesystem::exists(installLoc)) {
                                            game.installLocation = installLoc;
                                            game.installed = true;
                                        } else {
                                            game.installed = false;
                                        }
                                    } else {
                                        game.installed = false;
                                    }
                                    
                                    // Check if this is actually a game (not DLC or other content)
                                    bool isGame = true;
                                    if (doc.HasMember("Categories") && doc["Categories"].IsArray()) {
                                        for (const auto& category : doc["Categories"].GetArray()) {
                                            if (category.IsString()) {
                                                std::string catStr = category.GetString();
                                                if (catStr == "addons" || catStr == "DLC") {
                                                    isGame = false;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    
                                    if (hasRequiredFields && isGame && !game.displayName.empty()) {
                                        epicGames.push_back(game);
                                    }
                                }
                            }
                        }
                    }
                } catch (const std::filesystem::filesystem_error&) {
                    // Continue with empty results if directory access fails
                }
            }
        }
    } catch (const std::exception&) {
        // Return empty vector on any error
    }
    
    return epicGames;
}

} // namespace launcher