import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Star, Calendar, Users, Globe, ExternalLink, Loader2, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { rawgApi, type Game, type Screenshot } from '../lib/rawgapi';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import InstallDialog from '../components/dialog/installdialog';
import { type WuwaGameData } from '../lib/wuwafetch';
import { type DownloadInfo } from '../lib/downloadapi';

interface GameDetailProps {
  gameId: number | string;
  onBack: () => void;
  onNavigateToDownloads?: () => void;
}

const GameDetail: React.FC<GameDetailProps> = ({ gameId, onBack, onNavigateToDownloads }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedButtonIndex, setSelectedButtonIndex] = useState(0);
  
  // Installation state
  const [isInstalled] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [showInstallDialog, setShowInstallDialog] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [wuwaGameData] = useState<WuwaGameData | null>(null);
  const [downloadInfo] = useState<DownloadInfo | null>(null);
  const [currentFileIndex] = useState<number>(0);
  const [currentFileName] = useState<string>('');

  // Global state hooks
  const keyboardNav = useKeyboardNavigation();

  // Installation handlers
  const handlePlay = () => {
    console.log('Playing game:', game?.name);
    // Add game launch logic here
  };

  const handleShowInstallDialog = () => {
    setShowInstallDialog(true);
  };

  const handleInstall = () => {
    setIsInstalling(true);
    setShowInstallDialog(false);
    // Add installation logic here
    console.log('Starting installation for:', game?.name);
  };

  const handleCancelDownload = () => {
    setIsInstalling(false);
    setDownloadProgress(0);
    console.log('Cancelled installation for:', game?.name);
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
            // Play button action
            console.log('Play game:', game?.name);
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
          rawgApi.getGameDetails(gameId),
          rawgApi.getGameScreenshots(gameId)
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
  }, [gameId]);

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
        className="relative h-96 overflow-hidden -mt-16"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${selectedScreenshot || game.background_image})`
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

      {/* Install Dialog */}
      <InstallDialog
        isOpen={showInstallDialog}
        onClose={() => setShowInstallDialog(false)}
        onInstall={handleInstall}
        onCancel={() => setShowInstallDialog(false)}
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

export default GameDetail;