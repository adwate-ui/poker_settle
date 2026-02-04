import React from 'react';

export const GlobalCardDefs = () => (
    <svg width="0" height="0" className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
            {/* Hearts/Diamonds: Deep Crimson to Bright Red */}
            <linearGradient id="grad-hearts" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>

            {/* Spades/Clubs: Midnight Blue to Deep Charcoal/Black */}
            <linearGradient id="grad-spades" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#111827" />
            </linearGradient>

            {/* 4-Color Mode additions */}
            <linearGradient id="grad-diamonds" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            <linearGradient id="grad-clubs" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
            </linearGradient>

            {/* Royal Gold for face card frames */}
            <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="45%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Filter for embossed/ink effect */}
            <filter id="ink-depth" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.4" result="blur" />
                <feOffset in="blur" dx="0.3" dy="0.3" result="offsetBlur" />
                <feComposite in="SourceAlpha" in2="offsetBlur" operator="out" result="inset" />
                <feDropShadow dx="0.4" dy="0.4" stdDeviation="0.1" floodOpacity="0.3" />
            </filter>

            {/* Linen Texture Overlay Filter */}
            <filter id="linen-texture-filter" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
                <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.15 0" />
                <feComposite operator="in" in2="SourceGraphic" />
            </filter>
        </defs>
    </svg>
);
