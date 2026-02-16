import React from 'react';

interface LuxuryLayoutProps {
    children: React.ReactNode;
}

const LuxuryLayout: React.FC<LuxuryLayoutProps> = ({ children }) => {
    return (
        // Replaced hardcoded hex gradient with global CSS variables
        <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden md:pt-safe pb-safe transition-colors duration-300">

            {/* Unified Noise Texture */}
            <div className="bg-noise-texture" />

<<<<<<< HEAD
            <div className="relative z-10 px-0 sm:px-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
=======
            <div className="relative z-10 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-4 md:py-6">
>>>>>>> 09bf3fc (feat: create LuxuryLayout component for consistent page styling and structure)
                <header className="flex justify-end mb-2 md:mb-6">
                </header>
                <main className="animate-in fade-in zoom-in-95 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default LuxuryLayout;
