import { Wifi, User, Settings, Power, RotateCcw,  Search } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useHeaderControls, usePowerMenu } from "../hooks/useGlobalState";

interface HeaderProps {
    onSettingsClick?: () => void;
}

function Header({ onSettingsClick }: HeaderProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const headerControls = useHeaderControls();
    const powerMenu = usePowerMenu();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Close power menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (powerMenu.isOpen) {
                const target = event.target as Element;
                if (!target.closest('.power-menu-container')) {
                    powerMenu.setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [powerMenu.isOpen, powerMenu]);

    // Note: Keyboard navigation is now handled by useKeyboardNavigation hook
    // This effect is kept for any header-specific logic if needed
    useEffect(() => {
        // Header-specific keyboard handling can be added here if needed
        // Global navigation is handled by useKeyboardNavigation hook
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    return (
        <div className="h-10 fixed top-0 left-0 right-0 flex items-center justify-between w-screen z-20">
            {/* Left side - Search */}
            <div className="h-full w-full flex items-center">
                {/* Search Bar */}
                <div className="flex-1 h-full w-full">
                    <div className={`relative transition-all duration-200 h-full w-full`}>
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#aaa]" />
                        <input
                            type="text"
                            placeholder="Search games..."
                            value={headerControls.searchbar.query}
                            onChange={(e) => headerControls.searchbar.update({ query: e.target.value })}
                            onFocus={() => headerControls.searchbar.update({ isActive: true })}
                            onBlur={() => headerControls.searchbar.update({ isActive: false })}
                            className={`w-full h-full pl-10 pr-4 py-2  outline-none  text-white text-sm placeholder-[#aaa] transition-all duration-200 ${
                                headerControls.searchbar.isActive 
                                    ? 'border-blue-500 bg-[#333] shadow-lg' 
                                    : 'border-[#444] hover:border-[#555]'
                            }`}
                        />
                    </div>
                </div>
            </div>
            {/* Right side - Clock, Connection, Avatar, Settings */}
            <div className="h-full flex items-center">
                {/* Time */}
                <div className="text-[#fff] text-sm font-medium px-4">
                    {formatTime(currentTime)}
                </div>

                {/* Network Status */}
                <div
                    className={`h-full w-8 flex items-center justify-center hover:bg-[#1e1e1e] duration-200 cursor-pointer ${
                        headerControls.network.isConnected ? 'text-green-400' : 'text-red-400'
                    }`}
                    onClick={() => headerControls.network.update({ isConnected: !headerControls.network.isConnected })}
                    title={headerControls.network.isConnected ? 'Connected' : 'Disconnected'}
                >
                    <Wifi className="h-4 w-4" />
                </div>

                {/* User Avatar */}
                <div 
                    className={`h-full w-8 flex items-center justify-center hover:bg-[#1e1e1e] duration-200 cursor-pointer ${
                        headerControls.users.showUserMenu ? 'bg-[#1e1e1e]' : ''
                    }`}
                    onClick={() => headerControls.users.update({ showUserMenu: !headerControls.users.showUserMenu })}
                >
                    <User className="h-4 w-4 text-[#fff]" />
                </div>

                {/* Settings */}
                <div 
                    className={`h-full w-8 flex items-center justify-center hover:bg-[#1e1e1e] duration-200 cursor-pointer ${
                        headerControls.settings.showSettingsMenu ? 'bg-[#1e1e1e]' : ''
                    }`}
                    onClick={() => {
                        headerControls.settings.update({ showSettingsMenu: !headerControls.settings.showSettingsMenu });
                        if (onSettingsClick) onSettingsClick();
                    }}
                >
                    <Settings className="h-4 w-4 text-[#fff]" />
                </div>

                {/* Power Button */}
                <div className="relative power-menu-container">
                    <div
                        className={`h-full w-8 flex items-center justify-center hover:bg-[#1e1e1e] duration-200 cursor-pointer ${
                            powerMenu.isOpen ? 'bg-[#1e1e1e]' : ''
                        }`}
                        onClick={() => powerMenu.setPowerMenu(!powerMenu.isOpen)}
                    >
                        <Power className="h-4 w-4 text-[#fff]" />
                    </div>

                    {/* Power Menu Dropdown */}
                    {powerMenu.isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50"
                        >
                            <div className="py-2">
                                <motion.button
                                    whileHover={{ backgroundColor: '#2a2a2a' }}
                                    className={`w-full px-4 py-2 text-left text-white hover:bg-[#2a2a2a] flex items-center ${
                                        powerMenu.selectedIndex === 0 ? 'bg-[#2a2a2a]' : ''
                                    }`}
                                    onClick={() => {
                                        console.log('Power off clicked');
                                        powerMenu.setPowerMenu(false);
                                    }}
                                >
                                    <Power className="h-4 w-4 mr-3" />
                                    Power Off
                                </motion.button>
                                <motion.button
                                    whileHover={{ backgroundColor: '#2a2a2a' }}
                                    className={`w-full px-4 py-2 text-left text-white hover:bg-[#2a2a2a] flex items-center ${
                                        powerMenu.selectedIndex === 1 ? 'bg-[#2a2a2a]' : ''
                                    }`}
                                    onClick={() => {
                                        console.log('Restart clicked');
                                        powerMenu.setPowerMenu(false);
                                    }}
                                >
                                    <RotateCcw className="h-5 w-5 mr-3" />
                                    Restart
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </div>


            </div>
        </div>
    );
}

export default Header;