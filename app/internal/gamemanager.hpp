#pragma once

#include <string>
#include <vector>
#include <memory>
#include <optional>
#include <chrono>
#include <rapidjson/document.h>
#include <rapidjson/writer.h>
#include <rapidjson/stringbuffer.h>

namespace launcher {

enum class GameType {
    EXECUTABLE,
    STEAM,
    EPIC
};

struct Game {
    std::string id;
    std::string name;
    GameType type;
    std::optional<std::string> path;
    std::optional<std::string> steamId;
    std::optional<std::string> epicId;
    std::optional<std::string> icon;
    std::optional<std::string> banner;
    std::optional<std::chrono::system_clock::time_point> lastPlayed;
    std::optional<int> playtime;
    bool installed;

    // Convert to JSON
    std::string toJson() const;
    
    // Create from JSON
    static Game fromJson(const std::string& json);
};

struct SteamGame {
    std::string appid;
    std::string name;
    bool installed;
    std::optional<std::string> path;

    std::string toJson() const;
    static SteamGame fromJson(const std::string& json);
};

struct EpicGame {
    std::string catalogItemId;
    std::string displayName;
    bool installed;
    std::optional<std::string> installLocation;

    std::string toJson() const;
    static EpicGame fromJson(const std::string& json);
};

class GameManager {
public:
    static GameManager& getInstance();
    
    // Game management
    std::vector<Game> loadGames();
    void saveGames();
    Game addGame(const Game& game);
    bool removeGame(const std::string& gameId);
    std::optional<Game> updateGame(const std::string& gameId, const Game& updates);
    std::vector<Game> getGames() const;
    
    // Executable management
    std::optional<Game> addExecutable(const std::string& filePath);
    
    // Steam integration
    std::vector<SteamGame> scanSteamLibrary();
    std::vector<SteamGame> getSteamGames();
    
    // Epic Games integration
    std::vector<EpicGame> scanEpicLibrary();
    std::vector<EpicGame> getEpicGames();
    
    // Game launching
    bool launchGame(const std::string& gameId);
    bool launchExecutable(const std::string& path);
    bool launchSteamGame(const std::string& steamId);
    bool launchEpicGame(const std::string& epicId);
    
    // CEF IPC handler
    std::string handleCefQuery(const std::string& request);

private:
    GameManager() = default;
    ~GameManager() = default;
    GameManager(const GameManager&) = delete;
    GameManager& operator=(const GameManager&) = delete;
    
    std::vector<Game> games_;
    std::string getGamesFilePath() const;
    std::string generateGameId() const;
};

} // namespace launcher