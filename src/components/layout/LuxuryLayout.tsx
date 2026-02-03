import React from 'react';

interface LuxuryLayoutProps {
    children: React.ReactNode;
}

const LuxuryLayout: React.FC<LuxuryLayoutProps> = ({ children }) => {
    return (
        <div className="relative min-h-screen w-full bg-luxury-gradient overflow-x-hidden selection:bg-gold-500/30 selection:text-gold-200">
            {/* Noise Texture Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Content */}
            <div className="relative z-[2]">
                {children}
            </div>

            {/* Subtle bottom glow */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full h-[30vh] bg-gold-900/10 blur-[120px] pointer-events-none z-[0]" />
        </div>
    );
};

export default LuxuryLayout;
