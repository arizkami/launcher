// CEF IPC interface
declare global {
    interface Window {
        cefQuery: (options: {
            request: string;
            onSuccess: (response: string) => void;
            onFailure: (error_code: number, error_message: string) => void;
        }) => void;
    }
}

export interface Game {
    id: string;
    name: string;
    type: 'exe' | 'steam' | 'epic';
    path?: string;
    steamId?: string;
    epicId?: string;
    icon?: string;
    banner?: string;
    lastPlayed?: Date;
    playtime?: number;
    installed: boolean;
}

export interface SteamGame {
    appid: string;
    name: string;
    installed: boolean;
    path?: string;
}

export interface EpicGame {
    catalogItemId: string;
    displayName: string;
    installed: boolean;
    installLocation?: string;
}

export class GameManager {
    private static instance: GameManager;
    private games: Game[] = [];

    // Helper method for CEF IPC communication
    private async cefQuery(request: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!window.cefQuery) {
                reject(new Error('CEF not available'));
                return;
            }

            window.cefQuery({
                request: JSON.stringify(request),
                onSuccess: (response: string) => {
                    try {
                        resolve(JSON.parse(response));
                    } catch (error) {
                        resolve(response);
                    }
                },
                onFailure: (error_code: number, error_message: string) => {
                    reject(new Error(`CEF Error ${error_code}: ${error_message}`));
                }
            });
        });
    }

    static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    // Load games from local storage
    async loadGames(): Promise<Game[]> {
        try {
            const stored = localStorage.getItem('launcher_games');
            if (stored) {
                this.games = JSON.parse(stored).map((game: any) => ({
                    ...game,
                    lastPlayed: game.lastPlayed ? new Date(game.lastPlayed) : undefined
                }));
            }
            return this.games;
        } catch (error) {
            console.error('Failed to load games:', error);
            return [];
        }
    }

    // Save games to local storage
    private saveGames(): void {
        try {
            localStorage.setItem('launcher_games', JSON.stringify(this.games));
        } catch (error) {
            console.error('Failed to save games:', error);
        }
    }

    // Add a new game
    addGame(game: Omit<Game, 'id'>): Game {
        const newGame: Game = {
            ...game,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        this.games.push(newGame);
        this.saveGames();
        return newGame;
    }

    // Remove a game
    removeGame(gameId: string): boolean {
        const index = this.games.findIndex(game => game.id === gameId);
        if (index !== -1) {
            this.games.splice(index, 1);
            this.saveGames();
            return true;
        }
        return false;
    }

    // Update game info
    updateGame(gameId: string, updates: Partial<Game>): Game | null {
        const game = this.games.find(g => g.id === gameId);
        if (game) {
            Object.assign(game, updates);
            this.saveGames();
            return game;
        }
        return null;
    }

    // Get all games
    getGames(): Game[] {
        return [...this.games];
    }

    // Add executable file
    async addExecutable(filePath: string): Promise<Game | null> {
        try {
            // Extract game name from file path
            const fileName = filePath.split('\\').pop()?.replace('.exe', '') || 'Unknown Game';
            
            const game = this.addGame({
                name: fileName,
                type: 'exe',
                path: filePath,
                installed: true,
                lastPlayed: undefined,
                playtime: 0
            });

            return game;
        } catch (error) {
            console.error('Failed to add executable:', error);
            return null;
        }
    }

    // Scan Steam library
    async scanSteamLibrary(): Promise<Game[]> {
        try {
            const response = await this.cefQuery({
                action: 'scan_steam_library'
            });

            const steamGames: SteamGame[] = response.games || [];
            const addedGames: Game[] = [];
            
            for (const steamGame of steamGames) {
                // Check if game already exists
                const existing = this.games.find(g => g.steamId === steamGame.appid);
                if (!existing) {
                    const game = this.addGame({
                        name: steamGame.name,
                        type: 'steam',
                        steamId: steamGame.appid,
                        path: steamGame.path,
                        installed: steamGame.installed,
                        lastPlayed: undefined,
                        playtime: 0
                    });
                    addedGames.push(game);
                }
            }

            return addedGames;
        } catch (error) {
            console.error('Failed to scan Steam library:', error);
            return [];
        }
    }

    // Scan Epic Games library
    async scanEpicLibrary(): Promise<Game[]> {
        try {
            const response = await this.cefQuery({
                action: 'scan_epic_library'
            });

            const epicGames: EpicGame[] = response.games || [];
            const addedGames: Game[] = [];
            
            for (const epicGame of epicGames) {
                // Check if game already exists
                const existing = this.games.find(g => g.epicId === epicGame.catalogItemId);
                if (!existing) {
                    const game = this.addGame({
                        name: epicGame.displayName,
                        type: 'epic',
                        epicId: epicGame.catalogItemId,
                        path: epicGame.installLocation,
                        installed: epicGame.installed,
                        lastPlayed: undefined,
                        playtime: 0
                    });
                    addedGames.push(game);
                }
            }

            return addedGames;
        } catch (error) {
            console.error('Failed to scan Epic Games library:', error);
            return [];
        }
    }

    // Launch a game
    async launchGame(gameId: string): Promise<boolean> {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return false;

        try {
            let launchRequest: any = {
                action: 'launch_game',
                gameType: game.type,
                gameId: gameId
            };

            switch (game.type) {
                case 'exe':
                    if (game.path) {
                        launchRequest.path = game.path;
                    }
                    break;
                case 'steam':
                    if (game.steamId) {
                        launchRequest.steamId = game.steamId;
                    }
                    break;
                case 'epic':
                    if (game.epicId) {
                        launchRequest.epicId = game.epicId;
                    }
                    break;
            }

            await this.cefQuery(launchRequest);

            // Update last played time
            this.updateGame(gameId, { lastPlayed: new Date() });
            return true;
        } catch (error) {
            console.error('Failed to launch game:', error);
            return false;
        }
    }
}

export const gameManager = GameManager.getInstance();