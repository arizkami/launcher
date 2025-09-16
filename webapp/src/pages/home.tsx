import GameCard from "../components/gamecard";
import { useState, useEffect } from "react";
import { useHomeControls } from "../hooks/useGlobalState";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";

interface HomeProps {
    onGameSelect?: (gameId: number | string) => void;
}

function Home({ onGameSelect }: HomeProps) {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const homeControls = useHomeControls();
    // const navigation = useNavigation();
    
    // Use global keyboard navigation
    useKeyboardNavigation();
    
    // Sample game data for demonstration
    const sampleGames = [
        {
            id: 401805,
            title: "Genshin Impact",
            image: "https://launcher-webstatic.hoyoverse.com/launcher-public/2025/09/09/7c3ad643809627b15e6fbba79b32cf36_267427796540135767.webp",
            description: "A game about placing blocks and going on adventures.",
            category: "library"
        },
        {
            id: 959817,
            title: "Whuthering Waves",
            image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop",
            description: "A 5v5 character-based tactical FPS where precise gunplay meets unique agent abilities.",
            category: "recent"
        },
        {
            id: 123456,
            title: "Steam",
            image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
            description: "Gaming platform and digital distribution service.",
            category: "application"
        }
    ];

    // Filter games based on selected category
    const filteredGames = sampleGames.filter(game => 
        homeControls.navigation.currentSection === 'library' || game.category === homeControls.navigation.currentSection
    );

    // Set background image based on selected index
    useEffect(() => {
        if (filteredGames.length > 0) {
            setBackgroundImage(filteredGames[homeControls.gameSelect.selectedIndex]?.image || null);
        }
    }, [homeControls.gameSelect.selectedIndex, filteredGames]);

    // const handlePlay = (gameTitle: string) => {
    //     console.log(`Playing ${gameTitle}`);
    //     // Add game launch logic here
    // };

    return ( 
        <div className="relative p-6 h-full overflow-hidden pt-16">
            {/* Category Navigation */}
            <div className="relative z-20 mb-6">
                <div className="flex gap-4 justify-center">
                    {['all', 'library', 'recent', 'application'].map((category) => (
                        <button
                            key={category}
                            onClick={() => homeControls.navigation.setNavigation({ currentSection: category as any })}
                            className={`px-6 py-2 rounded-full text-sm transition-all duration-200 font-bold ${
                                homeControls.navigation.currentSection === category
                                    ? 'bg-white text-[#2a2a2a] shadow-lg'
                                    : 'bg-[#ececec15] text-[#aaa] hover:bg-[#3a3a3a] hover:text-white'
                            }`}
                        >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dynamic Background Blur */}
            <div 
                className={`fixed -z-1 inset-0 bg-cover bg-center transition-all duration-500 ease-out ${
                    backgroundImage ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ 
                    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                    filter: 'blur(20px) brightness(0.3)', 
                    transform: 'scale(1.1)'
                }}
            />
            
            {/* Content */}
            <div className="relative z-10">
                <div className="flex gap-4 justify-center">
                    {filteredGames.map((game, index) => (
                        <GameCard
                            key={game.id}
                            title={game.title}
                            image={game.image}
                            description={game.description}
                            onPlay={() => onGameSelect?.(game.id)}
                            onHover={setBackgroundImage}
                            isSelected={index === homeControls.gameSelect.selectedIndex}
                        />
                    ))}
                </div>
            </div>
        </div>
     );
}

export default Home;