import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Download, X, Star, Calendar, Users, Globe, ExternalLink, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { rawgApi, type Game, type Screenshot } from '../../lib/rawgapi';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { DownloadAPI, type DownloadInfo } from '../../lib/downloadapi';
import { WuwaFetcher, type WuwaGameData } from '../../lib/wuwafetch';
import InstallDialog from '../../components/dialog/installdialog';
import WuwaBanner from '../../assets/wuwafront.webp';

interface WuwaPageProps {
    gameId: number | string;
    onBack: () => void;
    onNavigateToDownloads?: () => void;
}
const WUWA_GAME_ID = 959817;

const WuwaPage: React.FC<WuwaPageProps> = ({ onBack, onNavigateToDownloads }) => {
    const [game, setGame] = useState<Game | null>(null);
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
    const [selectedButtonIndex, setSelectedButtonIndex] = useState(0);

    // Installation state
    const [isInstalling, setIsInstalling] = useState(false);
    const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isInstalled, setIsInstalled] = useState(false);

    // Installation dialog state
    const [showInstallDialog, setShowInstallDialog] = useState(false);
    const [wuwaGameData, setWuwaGameData] = useState<WuwaGameData | null>(null);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [currentFileName, setCurrentFileName] = useState('');

    // Download API instance (using static methods)
    // const downloadAPI = new DownloadAPI(); // Not needed - using static methods

    // Global state hooks
    const keyboardNav = useKeyboardNavigation();

    // Installation handlers
    // Handle showing installation dialog and fetching game data
    const handleShowInstallDialog = async () => {
        try {
            setShowInstallDialog(true);
            setError(null);

            // Fetch WuWa game data
            const result = await WuwaFetcher.fetchGameData();
            if (result.success && result.data) {
                setWuwaGameData(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch game data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch game data');
            setShowInstallDialog(false);
        }
    };

    const handleInstall = async () => {
        if (!wuwaGameData || !wuwaGameData.resources || wuwaGameData.resources.length === 0) {
            setError('No game data available for installation');
            return;
        }

        try {
            setIsInstalling(true);
            setError(null);
            setCurrentFileIndex(0);
            setCurrentFileName('Preparing installation...');

            // Start downloading files sequentially
            for (let i = 0; i < wuwaGameData.resources.length; i++) {
                const resource = wuwaGameData.resources[i];
                setCurrentFileIndex(i);
                setCurrentFileName(resource.dest || `File ${i + 1}`);

                const response = await DownloadAPI.startDownload({
                    url: resource.url,
                    filename: resource.dest,
                    directory: `C:\\Games\\WuWa`
                });

                if (!response.success) {
                    throw new Error(response.error || `Failed to download ${resource.dest}`);
                }

                const downloadId = response.downloadId!;

                // Poll for this file's completion
                await new Promise((resolve, reject) => {
                    const progressInterval = setInterval(async () => {
                        try {
                            const info = await DownloadAPI.getDownloadInfo(downloadId);
                            if (info.success && info.downloadInfo) {
                                setDownloadInfo(info.downloadInfo);

                                if (info.downloadInfo.status === 'completed') {
                                    clearInterval(progressInterval);
                                    resolve(void 0);
                                } else if (info.downloadInfo.status === 'failed') {
                                    clearInterval(progressInterval);
                                    reject(new Error('Download failed'));
                                }
                            }
                        } catch (err) {
                            clearInterval(progressInterval);
                            reject(err);
                        }
                    }, 1000);
                });

                // Update progress based on files completed
                const progress = ((i + 1) / wuwaGameData.resources.length) * 100;
                setDownloadProgress(progress);
            }

            // Installation completed
            setIsInstalled(true);
            setIsInstalling(false);
            setShowInstallDialog(false);
            setCurrentFileName('Installation completed!');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to install game');
            setIsInstalling(false);
        }
    };

    const handleCancelDownload = async () => {
        try {
            // Note: We need to track the current downloadId to cancel properly
            // For now, we'll just reset the state
            setIsInstalling(false);
            setDownloadInfo(null);
            setDownloadProgress(0);
            setShowInstallDialog(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel download');
        }
    };

    const handlePlay = () => {
        console.log('Playing game:', game?.name);
        // Here you would implement the actual game launch logic
    };

    // Keyboard navigation for game details page
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            keyboardNav.handleKeyPress(event.key, {
                'Escape': () => {
                    if (selectedScreenshot) {
                        setSelectedScreenshot(null);
                    } else {
                        onBack();
                    }
                },
                'Enter': () => {
                    if (selectedButtonIndex === 0) {
                        // Button action based on state
                        if (isInstalled) {
                            handlePlay();
                        } else if (isInstalling) {
                            handleCancelDownload();
                        } else {
                            handleShowInstallDialog();
                        }
                    } else if (selectedButtonIndex === 1) {
                        // Back button action
                        onBack();
                    }
                },
                'ArrowUp': () => {
                    setSelectedButtonIndex(prev => Math.max(0, prev - 1));
                },
                'ArrowDown': () => {
                    setSelectedButtonIndex(prev => Math.min(1, prev + 1));
                },
                'ArrowLeft': () => {
                    if (screenshots.length > 0) {
                        const currentIndex = screenshots.findIndex(s => s.image === selectedScreenshot);
                        const newIndex = currentIndex > 0 ? currentIndex - 1 : screenshots.length - 1;
                        setSelectedScreenshot(screenshots[newIndex].image);
                    }
                },
                'ArrowRight': () => {
                    if (screenshots.length > 0) {
                        const currentIndex = screenshots.findIndex(s => s.image === selectedScreenshot);
                        const newIndex = currentIndex < screenshots.length - 1 ? currentIndex + 1 : 0;
                        setSelectedScreenshot(screenshots[newIndex].image);
                    }
                }
            });
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedScreenshot, selectedButtonIndex, screenshots, game?.name, onBack]);

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [gameData, screenshotsData] = await Promise.all([
                    rawgApi.getGameDetails(WUWA_GAME_ID),
                    rawgApi.getGameScreenshots(WUWA_GAME_ID)
                ]);

                setGame(gameData);
                setScreenshots(screenshotsData.results);
                setSelectedScreenshot(gameData.background_image || null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load game details');
            } finally {
                setLoading(false);
            }
        };

        fetchGameData();
    }, []);

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full bg-[var(--console-bg)]"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mb-4"
                >
                    <Loader2 className="h-12 w-12 text-[var(--console-primary)]" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[var(--console-text)] text-xl"
                >
                    Loading game details...
                </motion.div>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center h-full bg-[var(--console-bg)] text-[var(--console-text)]"
            >
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl mb-4"
                >
                    Error: {error}
                </motion.div>
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="px-4 py-2 bg-[var(--console-primary)] hover:bg-[var(--console-accent)] rounded-md transition-colors"
                >
                    Go Back
                </motion.button>
            </motion.div>
        );
    }

    if (!game) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full bg-[var(--console-bg)]"
            >
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[var(--console-text)] text-xl"
                >
                    Game not found
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full relative bg-[var(--console-bg)] text-[var(--console-text)] overflow-y-auto"
        >
            {/* Header */}
            <div
                className="fixed w-full pt-12 left-0 right-0 z-10 border-[var(--console-border)] p-4"
            >
                <button
                    onClick={onBack}
                    className={`flex items-center gap-2 transition-colors ${selectedButtonIndex === 1
                            ? 'text-[var(--console-text)] bg-[var(--console-accent)] px-3 py-2 rounded-md'
                            : 'text-[var(--console-text-secondary)] hover:text-[var(--console-text)]'
                        }`}
                >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Games
                </button>
            </div>

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative h-96 overflow-hidden -mt-16 w-full"
            >
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${WuwaBanner})`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--console-bg)] via-[var(--console-bg)]/50 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-bold mb-2 text-white"
                        >
                            {game.name}
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 text-sm text-gray-300"
                        >
                            {game.released && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(game.released).getFullYear()}
                                </div>
                            )}
                            {game.rating > 0 && (
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {game.rating.toFixed(1)}
                                </div>
                            )}
                            {game.playtime > 0 && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {game.playtime}h avg playtime
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto p-6"
            >
                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 mb-8"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full transition-colors font-medium ${selectedButtonIndex === 0
                                ? 'bg-white/10 text-white shadow-lg shadow-[var(--console-glow)]/25'
                                : isInstalled
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : isInstalling
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-[var(--console-primary)] hover:bg-[var(--console-accent)]'
                            }`}
                        onClick={() => {
                            if (isInstalled) {
                                handlePlay();
                            } else if (isInstalling) {
                                handleCancelDownload();
                            } else {
                                handleShowInstallDialog();
                            }
                        }}
                        disabled={loading}
                    >
                        {isInstalled ? (
                            <>
                                <Play className="h-5 w-5" />
                                Play Game
                            </>
                        ) : isInstalling ? (
                            <>
                                <X className="h-5 w-5" />
                                Cancel Installation
                            </>
                        ) : (
                            <>
                                <Download className="h-5 w-5" />
                                Install Game
                            </>
                        )}
                    </motion.button>
                    {game?.website && (
                        <motion.a
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href={game.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 border border-[var(--console-border)] hover:border-[var(--console-text-secondary)] rounded-full transition-colors"
                        >
                            <Globe className="h-5 w-5" />
                            Official Website
                            <ExternalLink className="h-4 w-4" />
                        </motion.a>
                    )}
                </motion.div>

                {/* Download Progress */}
                {isInstalling && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 bg-[var(--console-bg-secondary)] rounded-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Installing {game?.name}</span>
                            <span className="text-sm text-[var(--console-text-secondary)]">
                                {downloadProgress.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-[var(--console-bg)] rounded-full h-2 mb-3">
                            <motion.div
                                className="bg-[var(--console-primary)] h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${downloadProgress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Current File Info */}
                        <div className="flex items-center gap-2 mb-2 text-sm">
                            <FileText size={16} className="text-[var(--console-accent)]" />
                            <div className="flex-1 min-w-0">
                                <div className="text-[var(--console-text-primary)] truncate">
                                    {currentFileName || 'Preparing...'}
                                </div>
                                <div className="text-xs text-[var(--console-text-secondary)]">
                                    File {currentFileIndex + 1} of {wuwaGameData?.resources?.length || 0}
                                </div>
                            </div>
                        </div>

                        {/* Download Stats */}
                        <div className="flex justify-between text-xs text-[var(--console-text-secondary)]">
                            <span>
                                {downloadInfo?.downloadedBytes ?
                                    WuwaFetcher.formatBytes(downloadInfo.downloadedBytes) :
                                    '0 Bytes'
                                } / {downloadInfo?.totalBytes ?
                                    WuwaFetcher.formatBytes(downloadInfo.totalBytes) :
                                    wuwaGameData?.totalSize ?
                                        WuwaFetcher.formatBytes(wuwaGameData.totalSize) :
                                        'Unknown'
                                }
                            </span>
                            <span>
                                {downloadInfo?.speed ?
                                    `${WuwaFetcher.formatBytes(downloadInfo.speed)}/s` :
                                    '0 Bytes/s'
                                }
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Game Info Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Description */}
                        {game.description_raw && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <h2 className="text-2xl font-bold mb-4">About</h2>
                                <p className="text-[var(--console-text-secondary)] leading-relaxed">
                                    {game.description_raw}
                                </p>
                            </motion.div>
                        )}

                        {/* Screenshots */}
                        {screenshots.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {screenshots.slice(0, 6).map((screenshot) => (
                                        <motion.div
                                            key={screenshot.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                            className="aspect-video bg-[var(--console-bg-secondary)] rounded-lg overflow-hidden cursor-pointer transition-opacity relative"
                                            onClick={() => setSelectedScreenshot(screenshot.image)}
                                        >
                                            <AnimatePresence>
                                                {imageLoading[screenshot.image] && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="absolute inset-0 flex items-center justify-center bg-[var(--console-bg-secondary)]"
                                                    >
                                                        <Loader2 className="h-6 w-6 animate-spin text-[var(--console-primary)]" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <motion.img
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: imageLoading[screenshot.image] ? 0 : 1 }}
                                                transition={{ duration: 0.3 }}
                                                src={screenshot.image}
                                                alt="Game screenshot"
                                                className="w-full h-full object-cover"
                                                onLoad={() => setImageLoading(prev => ({ ...prev, [screenshot.image]: false }))}
                                                onLoadStart={() => setImageLoading(prev => ({ ...prev, [screenshot.image]: true }))}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Platforms */}
                        {game.platforms && game.platforms.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h3 className="text-lg font-semibold mb-3">Platforms</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.platforms.map((platform) => (
                                        <motion.span
                                            key={platform.platform.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="px-3 py-1 bg-[var(--console-bg-secondary)] rounded-full text-sm"
                                        >
                                            {platform.platform.name}
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Genres */}
                        {game.genres && game.genres.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h3 className="text-lg font-semibold mb-3">Genres</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.genres.map((genre) => (
                                        <motion.span
                                            key={genre.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="px-3 py-1 bg-[var(--console-accent)] rounded-full text-sm"
                                        >
                                            {genre.name}
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Developers */}
                        {game.developers && game.developers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h3 className="text-lg font-semibold mb-3">Developers</h3>
                                <div className="space-y-1">
                                    {game.developers.map((developer) => (
                                        <motion.div
                                            key={developer.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-[var(--console-text-secondary)]"
                                        >
                                            {developer.name}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Publishers */}
                        {game.publishers && game.publishers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h3 className="text-lg font-semibold mb-3">Publishers</h3>
                                <div className="space-y-1">
                                    {game.publishers.map((publisher) => (
                                        <motion.div
                                            key={publisher.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-[var(--console-text-secondary)]"
                                        >
                                            {publisher.name}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Rating */}
                        {game.metacritic && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h3 className="text-lg font-semibold mb-3">Metacritic Score</h3>
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`
                      px-3 py-1 rounded font-bold text-white
                      ${game.metacritic >= 75 ? 'bg-green-600' :
                                                game.metacritic >= 50 ? 'bg-yellow-600' : 'bg-red-600'}
                    `}
                                    >
                                        {game.metacritic}
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Installation Dialog */}
            <InstallDialog
                isOpen={showInstallDialog}
                onClose={() => setShowInstallDialog(false)}
                onInstall={handleInstall}
                onCancel={handleCancelDownload}
                onNavigateToDownloads={onNavigateToDownloads}
                wuwaGameData={wuwaGameData}
                isInstalling={isInstalling}
                downloadProgress={downloadProgress}
                downloadInfo={downloadInfo}
                currentFileIndex={currentFileIndex}
                currentFileName={currentFileName}
            />
        </motion.div>
    );
};

export default WuwaPage;