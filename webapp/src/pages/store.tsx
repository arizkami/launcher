import React from 'react';

interface StoreProps {
    onGameSelect?: (gameId: number | string) => void;
}
//@ts-ignore
const Store: React.FC<StoreProps> = ({ onGameSelect }) => {
    return (
        <div className="relative h-full bg-[var(--console-bg)] text-[var(--console-text)] overflow-y-auto">
            {/* Background gradient for header transparency */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--console-bg)]/80 to-[var(--console-bg)]" />
            
            {/* Content with proper spacing for transparent header */}
            <div className="relative z-10 pt-20 p-6">
                <h1 className="text-2xl font-bold mb-4">Game Store</h1>
                <p>Browse and purchase new games here.</p>
                <p className="text-sm text-[var(--console-text-secondary)] mt-2">
                    Click on any game to view its details.
                </p>
            </div>
        </div>
    );
};

export default Store;