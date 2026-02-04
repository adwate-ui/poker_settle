import React from 'react';
import ThemeToggle from '../ThemeToggle';

interface LuxuryLayoutProps {
    children: React.ReactNode;
}

const LuxuryLayout: React.FC<LuxuryLayoutProps> = ({ children }) => {
    return (
        // Replaced hardcoded hex gradient with global CSS variables
        <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden pt-safe pb-safe transition-colors duration-300">

            {/* Unified Noise Texture */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                <header className="flex justify-end mb-6">
                    <ThemeToggle />
                </header>
                <main className="animate-in fade-in zoom-in-95 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default LuxuryLayout;
