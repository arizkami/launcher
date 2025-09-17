import { useState, useEffect } from "react";
import { Plus, Folder, Gamepad2, Search, Filter, Grid, List, Trash2 } from "lucide-react";
import SteamLogo from "../assets/steam.svg";

interface Game {
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

interface LibraryProps {
    onBack?: () => void;
    onGameSelect?: (gameId: number | string) => void;
}
//@ts-expect-error
function Library({ onBack, onGameSelect }: LibraryProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<'all' | 'exe' | 'steam' | 'epic'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showAddGameModal, setShowAddGameModal] = useState(false);

    // Mock data for demonstration
    useEffect(() => {
        const mockGames: Game[] = [
            {
                id: '1',
                name: 'Genshin Impact',
                type: 'exe',
                path: 'C:\\Program Files\\Genshin Impact\\GenshinImpact.exe',
                installed: true,
                lastPlayed: new Date('2024-01-15'),
                playtime: 120
            },
            {
                id: '2',
                name: 'Counter-Strike 2',
                type: 'steam',
                steamId: '730',
                installed: true,
                lastPlayed: new Date('2024-01-14'),
                playtime: 450
            },
            {
                id: '3',
                name: 'Fortnite',
                type: 'epic',
                epicId: 'fortnite',
                installed: true,
                lastPlayed: new Date('2024-01-13'),
                playtime: 200
            }
        ];
        setGames(mockGames);
    }, []);

    const filteredGames = games.filter(game => {
        const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || game.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const handleAddGame = (type: 'exe' | 'steam' | 'epic') => {
        // This will be implemented with actual file/game selection logic
        console.log(`Adding ${type} game`);
        setShowAddGameModal(false);
    }

    const handleRemoveGame = (gameId: string) => {
        setGames(games.filter(game => game.id !== gameId));
    };

    const getGameIcon = (game: Game) => {
        switch (game.type) {
            case 'steam':
                //@ts-expect-error
                return <SteamLogo className="w-5 h-5" />;
            case 'epic':
                return <Gamepad2 className="w-5 h-5" />;
            default:
                return <Folder className="w-5 h-5" />;
        }
    };

    return (
        <div className="relative h-full bg-[var(--console-bg)] text-[var(--console-text)] overflow-y-auto pt-8">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--console-bg)]/95 backdrop-blur-sm border-b border-[var(--console-border)] p-6 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">My Library</h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            className="p-2 rounded-lg bg-[var(--console-secondary)] hover:bg-[var(--console-accent)] transition-colors"
                        >
                            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setShowAddGameModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--console-primary)] hover:bg-[var(--console-accent)] text-white transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Game
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--console-text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search games..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--console-secondary)] border border-[var(--console-border)] focus:border-[var(--console-primary)] focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-[var(--console-text-secondary)]" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="px-3 py-2 rounded-lg bg-[var(--console-secondary)] border border-[var(--console-border)] focus:border-[var(--console-primary)] focus:outline-none"
                        >
                            <option value="all">All Games</option>
                            <option value="exe">Executable</option>
                            <option value="steam">Steam</option>
                            <option value="epic">Epic Games</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Games Grid/List */}
            <div className="p-6">
                {filteredGames.length === 0 ? (
                    <div className="text-center py-12">
                        <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-[var(--console-text-secondary)]" />
                        <h3 className="text-xl font-semibold mb-2">No games found</h3>
                        <p className="text-[var(--console-text-secondary)] mb-4">
                            {searchTerm || filterType !== 'all' 
                                ? 'Try adjusting your search or filter criteria'
                                : 'Add your first game to get started'
                            }
                        </p>
                        <button
                            onClick={() => setShowAddGameModal(true)}
                            className="px-6 py-3 rounded-lg bg-[var(--console-primary)] hover:bg-[var(--console-accent)] text-white transition-colors"
                        >
                            Add Game
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-3'
                    }>
                        {filteredGames.map((game) => (
                            <div
                                key={game.id}
                                className={`group relative rounded-lg border border-[var(--console-border)] bg-[var(--console-secondary)] hover:bg-[var(--console-accent)]/20 transition-all duration-200 ${
                                    viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center gap-4'
                                }`}
                            >
                                {viewMode === 'grid' ? (
                                    <>
                                        <div className="aspect-video bg-[var(--console-bg)] rounded-lg mb-3 flex items-center justify-center">
                                            {getGameIcon(game)}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-semibold truncate">{game.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-[var(--console-text-secondary)]">
                                                {getGameIcon(game)}
                                                <span className="capitalize">{game.type}</span>
                                            </div>
                                            {game.lastPlayed && (
                                                <p className="text-xs text-[var(--console-text-secondary)]">
                                                    Last played: {game.lastPlayed.toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveGame(game.id)}
                                            className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-[var(--console-bg)] rounded-lg flex items-center justify-center">
                                            {getGameIcon(game)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{game.name}</h3>
                                            <div className="flex items-center gap-4 text-sm text-[var(--console-text-secondary)]">
                                                <span className="capitalize">{game.type}</span>
                                                {game.lastPlayed && (
                                                    <span>Last played: {game.lastPlayed.toLocaleDateString()}</span>
                                                )}
                                                {game.playtime && (
                                                    <span>{game.playtime}h played</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveGame(game.id)}
                                            className="p-2 rounded opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Game Modal */}
            {showAddGameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[var(--console-bg)] rounded-lg border border-[var(--console-border)] p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-4">Add Game to Library</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleAddGame('exe')}
                                className="w-full flex items-center gap-3 p-4 rounded-lg bg-[var(--console-secondary)] hover:bg-[var(--console-accent)]/20 transition-colors text-left"
                            >
                                <Folder className="w-6 h-6" />
                                <div>
                                    <div className="font-semibold">Add Executable</div>
                                    <div className="text-sm text-[var(--console-text-secondary)]">Browse for .exe files</div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleAddGame('steam')}
                                className="w-full flex items-center gap-3 p-4 rounded-lg bg-[var(--console-secondary)] hover:bg-[var(--console-accent)]/20 transition-colors text-left"
                            >
                                <SteamLogo className="w-6 h-6" />
                                <div>
                                    <div className="font-semibold">Import from Steam</div>
                                    <div className="text-sm text-[var(--console-text-secondary)]">Scan Steam library</div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleAddGame('epic')}
                                className="w-full flex items-center gap-3 p-4 rounded-lg bg-[var(--console-secondary)] hover:bg-[var(--console-accent)]/20 transition-colors text-left"
                            >
                                <Gamepad2 className="w-6 h-6" />
                                <div>
                                    <div className="font-semibold">Import from Epic Games</div>
                                    <div className="text-sm text-[var(--console-text-secondary)]">Scan Epic Games library</div>
                                </div>
                            </button>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddGameModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-[var(--console-border)] hover:bg-[var(--console-secondary)] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Library;