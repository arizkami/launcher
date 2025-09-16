import { useState, useEffect } from 'react';
import { Home, Library, Store, Settings, User, Power } from 'lucide-react';

interface SidebarProps {
    currentPage: string;
    onPageChange: (page: string) => void;
}

function Sidebar({ currentPage, onPageChange }: SidebarProps) {
    const [isVisible, setIsVisible] = useState(false);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const navigationItems = [
        { id: 'home', icon: Home, label: 'Home', color: 'text-blue-400' },
        { id: 'library', icon: Library, label: 'Library', color: 'text-green-400' },
        { id: 'store', icon: Store, label: 'Store', color: 'text-purple-400' },
        { id: 'settings', icon: Settings, label: 'Settings', color: 'text-gray-400' },
    ];

    // const gameItems = [
    //     { id: 'genshin', name: 'Genshin Impact', image: '/genshin.webp', color: 'border-blue-400' },
    //     { id: 'hsr', name: 'Honkai Star Rail', image: '/hsr.webp', color: 'border-yellow-400' },
    //     { id: 'zzz', name: 'Zenless Zone Zero', image: '/zzz.webp', color: 'border-red-400' },
    //     { id: 'hi3', name: 'Honkai Impact 3rd', image: '/hi3.webp', color: 'border-pink-400' },
    // ];

    return (
        <div 
            className={`fixed left-0 top-0 h-screen bg-black/90 backdrop-blur-xl border-r border-gray-800 transition-transform duration-300 z-50 w-64 ${
                isVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Power className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-white font-bold text-lg">Launcher</div>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-2 space-y-2">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                                isActive 
                                    ? 'bg-white/10 border border-white/20' 
                                    : 'hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-400 group-hover:text-white'}`} />
                            <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* User Profile */}
            <div className="absolute bottom-4 left-2 right-2">
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                        <div className="text-sm text-white font-medium">Player</div>
                        <div className="text-xs text-gray-400">Online</div>
                    </div>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;