import { useState } from "react";
import { Play } from "lucide-react";

interface GameCardProps {
    title: string;
    image: string;
    description?: string;
    onPlay?: () => void;
    onHover?: (image: string | null) => void;
    isSelected?: boolean;
}

function GameCard({ title, image, description, onPlay, onHover, isSelected = false }: GameCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        onHover?.(image);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        onHover?.(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlay?.();
        }
    };

    const handleClick = () => {
        onPlay?.();
    };

    return (
        <div 
            className={`
                relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 ease-in-out
                ${isHovered || isSelected ? 'w-128 h-64' : 'w-48 h-64'}
                ${isSelected ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/50' : 'border border-[#333] hover:border-[#555]'}
                bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            `}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`Play ${title}`}
        >
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                    backgroundImage: `url(${image})`
                }}
            />
            
            {/* Overlay */}
            <div className={`
                absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                transition-opacity duration-300
                ${isHovered || isSelected ? 'opacity-100' : 'opacity-60'}
            `} />
            
            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <div className="text-white">
                    <h3 className="text-lg font-semibold mb-1 truncate">{title}</h3>
                    
                    {/* Description - show on hover or selected */}
                    {(isHovered || isSelected) && description && (
                        <p className="text-sm text-gray-300 mb-3 whitespace-nowrap overflow-hidden text-ellipsis opacity-0 animate-slide-up">
                            {description}
                        </p>
                    )}
                    
                    {/* Play Button - show on hover or selected */}
                    {(isHovered || isSelected) && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlay?.();
                            }}
                            className="
                                flex items-center gap-2 px-4 py-2 bg-white hover:white/50
                                rounded-md transition-colors duration-200 opacity-0 animate-slide-up
                                text-sm font-medium text-black
                            "
                        >
                            <Play className="h-4 w-4" />
                            Play
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GameCard;