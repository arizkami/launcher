import GameCard from "../components/gamecard";
import { useState, useEffect } from "react";
import { useHomeControls } from "../hooks/useGlobalState";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { Plus, Library } from "lucide-react";
import GenshinBanner from "../assets/gifull.png"
import WuwaBanner from "../assets/wuwa.png"
import SteamBanner from "../assets/steam.png"

interface HomeProps {
    onGameSelect?: (gameId: number | string) => void;
    onNavigateToLibrary?: () => void;
}

function Home({ onGameSelect, onNavigateToLibrary }: HomeProps) {
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
            image: GenshinBanner,
            description: "Step Into a Vast Magical World of Adventure",
            category: "library"
        },
        {
            id: 959817,
            title: "Whuthering Waves",
            image: WuwaBanner,
            description: "a story-rich open-world action RPG with a high degree of freedom",
            category: "recent"
        },
        {
            id: 123456,
            title: "Steam",
            image: SteamBanner,
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
        <div className="relative h-full overflow-hidden">
            {/* Category Navigation */}
            <div className="bg-[#292932bd] py-16 p-6 shadow-2xl">
                <div className="relative z-20 mb-6">
                    <div className="flex gap-4 justify-between items-center">
                        <div className="flex gap-4">
                            {['all', 'library', 'recent', 'application'].map((category) => (
                                <button
                                    key={category}
                                    onClick={() => homeControls.navigation.setNavigation({ currentSection: category as any })}
                                    className={`px-6 py-2 rounded-full text-sm transition-all duration-200 font-bold ${homeControls.navigation.currentSection === category
                                        ? 'bg-white text-[#2a2a2a] shadow-lg'
                                        : 'bg-[#ececec15] text-[#aaa] hover:bg-[#3a3a3a] hover:text-white'
                                        }`}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Add Game to Library Button */}
                        <div className="flex gap-2 ml-8">
                            <button
                                onClick={onNavigateToLibrary}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm transition-all duration-200 font-bold bg-[#ececec15] text-[#aaa] hover:bg-[#3a3a3a] hover:text-white`}
                            >
                                <Library className="w-4 h-4" />
                                <span>My Library</span>
                            </button>
                            <button
                                onClick={onNavigateToLibrary}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm transition-all duration-200 font-bold bg-[#ececec15] text-[#aaa] hover:bg-[#3a3a3a] hover:text-white`}
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Game</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex gap-4">
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

            {/* content */}
            <div>

            </div>

            {/* Dynamic Background Blur */}
            <div className="fixed inset-0 -z-10">
                <div
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ease-out ${backgroundImage ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{
                        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                        filter: 'blur(20px) brightness(0.3)',
                        transform: 'scale(1.1)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e] to-transparent" />
            </div>

        </div>
    );
}

export default Home;