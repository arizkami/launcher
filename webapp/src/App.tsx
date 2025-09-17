import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/header';
// import Sidebar from './components/sidebar';
import Home from './pages/home';
import GameDetail from './pages/gamedetail';
import Library from './pages/library';
import Store from './pages/store';
import Settings from './pages/settings';
import { GlobalStateProvider } from './hooks/useGlobalState';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { MagicMouse } from 'magicmouse.ts';
//@ts-expect-error
import '@fontsource-variable/inter';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedGameId, setSelectedGameId] = useState<number | string | null>(null);

  // Initialize global keyboard navigation
  useKeyboardNavigation();

  return (
    <motion.div
      className="h-screen w-screen flex bg-black"
      initial={{ opacity: 0, scale: 1.45 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        '--console-bg': '#16161a',
        '--console-bg-secondary': '#1a1a2e',
        '--console-accent': '#16213e',
        '--console-primary': '#0f3460',
        '--console-text': '#ffffff',
        '--console-text-secondary': '#a0a0a0',
        '--console-border': '#3b3b3b',
        '--console-glow': '#e94560',
        '--console-success': '#00ff88',
        '--console-warning': '#ffaa00',
        '--console-error': '#ff4757'
      } as React.CSSProperties}>

      {/* Background Effects */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--console-primary)_0%,_transparent_50%)] opacity-20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--console-accent)_0%,_transparent_50%)] opacity-30"></div>
       */}
      {/* Main Layout */}
      <MagicMouse color="#fff" MagicMouseOff={true}>
        <div className="relative z-10 flex h-full">
          {/* <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} /> */}

          <div className="flex-1 flex flex-col w-screen">
            <Header
              onSettingsClick={() => setCurrentPage('settings')}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {currentPage === 'gamedetail' && selectedGameId && (
                  <motion.div
                    key="gamedetail"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <GameDetail
                      gameId={selectedGameId}
                      onBack={() => setCurrentPage('home')}
                    />
                  </motion.div>
                )}
                {currentPage === 'home' && (
                  <motion.div
                    key="store"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <Home
                      onGameSelect={(gameId) => {
                        setSelectedGameId(gameId);
                        setCurrentPage('gamedetail');
                      }}
                      onNavigateToLibrary={() => setCurrentPage('library')}
                    />
                  </motion.div>
                )}
                {currentPage === 'library' && (
                  <motion.div
                    key="library"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <Library onGameSelect={(gameId: number | string) => {
                      setSelectedGameId(gameId);
                      setCurrentPage('gamedetail');
                    }} />
                  </motion.div>
                )}
                {currentPage === 'store' && (
                  <motion.div
                    key="store"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <Store onGameSelect={(gameId) => {
                      setSelectedGameId(gameId);
                      setCurrentPage('gamedetail');
                    }} />
                  </motion.div>
                )}
                {currentPage === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <Settings onBack={() => setCurrentPage('home')} />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </MagicMouse>
    </motion.div>
  );
};

const App: React.FC = () => {
  return (
    <GlobalStateProvider>
      <AppContent />
    </GlobalStateProvider>
  );
};

export default App
