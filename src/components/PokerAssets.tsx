// SVG-based poker chip and card back assets
// These are inline SVG components that are much smaller and scale perfectly

import { useMemo } from 'react';

// Pre-calculate edge pattern points for poker chip
const CHIP_EDGE_PATTERN = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i * 360) / 24;
  const x1 = 50 + 44 * Math.cos((angle * Math.PI) / 180);
  const y1 = 50 + 44 * Math.sin((angle * Math.PI) / 180);
  const x2 = 50 + 38 * Math.cos((angle * Math.PI) / 180);
  const y2 = 50 + 38 * Math.sin((angle * Math.PI) / 180);
  return { x1, y1, x2, y2 };
});

// Pre-calculate small value indicator positions
const CHIP_VALUE_POSITIONS = [0, 90, 180, 270].map((angle) => ({
  x: 50 + 20 * Math.cos((angle * Math.PI) / 180),
  y: 50 + 20 * Math.sin((angle * Math.PI) / 180),
}));

export const PokerChipSVG = ({ 
  value, 
  color, 
  size = 64 
}: { 
  value: string; 
  color: string; 
  size?: number 
}) => {
  const colorSchemes: Record<string, { primary: string; secondary: string; accent: string; text: string; border: string }> = {
    black: { primary: '#1a1a1a', secondary: '#0f0f0f', accent: '#333333', text: '#ffffff', border: '#d4af37' },
    red: { primary: '#b91c1c', secondary: '#7f1d1d', accent: '#dc2626', text: '#ffffff', border: '#fef3c7' },
    green: { primary: '#15803d', secondary: '#14532d', accent: '#16a34a', text: '#ffffff', border: '#fef3c7' },
    white: { primary: '#ffffff', secondary: '#f3f4f6', accent: '#e5e7eb', text: '#1f2937', border: '#3b82f6' },
    blue: { primary: '#1e40af', secondary: '#1e3a8a', accent: '#2563eb', text: '#ffffff', border: '#fef3c7' },
    yellow: { primary: '#eab308', secondary: '#a16207', accent: '#fbbf24', text: '#1f2937', border: '#92400e' },
  };

  const scheme = colorSchemes[color] || colorSchemes.white;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Radial gradient for 3D effect */}
        <radialGradient id={`chipGradient-${color}`} cx="35%" cy="35%">
          <stop offset="0%" stopColor={scheme.accent} />
          <stop offset="70%" stopColor={scheme.primary} />
          <stop offset="100%" stopColor={scheme.secondary} />
        </radialGradient>
        
        {/* Shadow for depth */}
        <filter id={`chipShadow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
          <feOffset dx="1" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Drop shadow circle */}
      <circle cx="51" cy="52" r="48" fill="black" opacity="0.15" />
      
      {/* Outer border ring with premium gold/accent */}
      <circle 
        cx="50" 
        cy="50" 
        r="49" 
        fill="none" 
        stroke={scheme.border} 
        strokeWidth="2"
        filter={`url(#chipShadow-${color})`}
      />
      
      {/* Main chip body with gradient */}
      <circle cx="50" cy="50" r="47" fill={`url(#chipGradient-${color})`} />
      
      {/* Edge spots pattern - casino style */}
      {CHIP_EDGE_PATTERN.map((point, i) => (
        <g key={i}>
          {i % 2 === 0 ? (
            // Alternating edge inserts for premium look
            <rect
              x={point.x2 - 2}
              y={point.y2 - 3}
              width="4"
              height="6"
              fill={scheme.border}
              transform={`rotate(${(i * 360) / 24} 50 50)`}
              opacity="0.9"
            />
          ) : null}
        </g>
      ))}
      
      {/* Middle ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="38" 
        fill="none" 
        stroke={scheme.border} 
        strokeWidth="1.5"
        opacity="0.8"
      />
      
      {/* Inner circle with subtle gradient */}
      <circle cx="50" cy="50" r="36" fill={scheme.secondary} opacity="0.3" />
      
      {/* Center medallion */}
      <circle cx="50" cy="50" r="30" fill={scheme.primary} />
      <circle 
        cx="50" 
        cy="50" 
        r="30" 
        fill="none" 
        stroke={scheme.border} 
        strokeWidth="1"
        opacity="0.6"
      />
      
      {/* Highlight for 3D effect */}
      <ellipse 
        cx="42" 
        cy="42" 
        rx="12" 
        ry="8" 
        fill="white" 
        opacity="0.2"
        transform="rotate(-30 42 42)"
      />
      
      {/* Main value text with shadow */}
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fill="black"
        fontSize="20"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        opacity="0.2"
      >
        {value}
      </text>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill={scheme.text}
        fontSize="20"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
      >
        {value}
      </text>
      
      {/* Corner value indicators - smaller, refined */}
      {CHIP_VALUE_POSITIONS.map((pos, i) => (
        <g key={i}>
          <circle 
            cx={pos.x} 
            cy={pos.y} 
            r="8" 
            fill={scheme.secondary}
            opacity="0.8"
          />
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={scheme.text}
            fontSize="7"
            fontWeight="bold"
          >
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
};

export const CardBackSVG = ({ width = 78, height = 112, design = 'classic' }: { width?: number; height?: number; design?: 'classic' | 'geometric' | 'diamond' | 'hexagon' | 'wave' | 'radial' }) => {
  // Classic design (existing)
  if (design === 'classic') {
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 78 112" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Define gradients and patterns */}
        <defs>
          {/* Radial gradient for depth */}
          <radialGradient id="cardBackGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#1a5c3e" />
            <stop offset="50%" stopColor="#0e4429" />
            <stop offset="100%" stopColor="#0a3520" />
          </radialGradient>
          
          {/* Linear gradient for border shine */}
          <linearGradient id="borderShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#b8941f" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.8" />
          </linearGradient>
          
          {/* Pattern for ornate background */}
          <pattern id="ornatePattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="#2d7a51" opacity="0.3" />
          </pattern>
        </defs>
        
        {/* Outer card border with gold accent */}
        <rect 
          width="78" 
          height="112" 
          rx="7" 
          fill="url(#cardBackGradient)" 
          stroke="url(#borderShine)" 
          strokeWidth="2.5"
        />
        
        {/* Secondary inner border - gold accent */}
        <rect 
          x="3" 
          y="3" 
          width="72" 
          height="106" 
          rx="5" 
          fill="none" 
          stroke="#d4af37" 
          strokeWidth="0.8"
          opacity="0.7"
        />
        
        {/* Pattern background */}
        <rect 
          x="7" 
          y="7" 
          width="64" 
          height="98" 
          rx="4" 
          fill="url(#ornatePattern)"
        />
        
        {/* Ornate frame border */}
        <rect 
          x="7" 
          y="7" 
          width="64" 
          height="98" 
          rx="4" 
          fill="none" 
          stroke="#1a5c3e" 
          strokeWidth="1.5"
        />
        
        {/* Center ornamental design - elegant diamond lattice */}
        <g opacity="0.85">
          {/* Main center diamond with intricate details */}
          <path 
            d="M 39 25 L 53 39 L 39 53 L 25 39 Z" 
            fill="none" 
            stroke="#d4af37" 
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path 
            d="M 39 30 L 48 39 L 39 48 L 30 39 Z" 
            fill="none" 
            stroke="#b8941f" 
            strokeWidth="1.2"
            opacity="0.6"
          />
          
          {/* Middle section */}
          <path 
            d="M 39 59 L 53 73 L 39 87 L 25 73 Z" 
            fill="none" 
            stroke="#d4af37" 
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path 
            d="M 39 64 L 48 73 L 39 82 L 30 73 Z" 
            fill="none" 
            stroke="#b8941f" 
            strokeWidth="1.2"
            opacity="0.6"
          />
          
          {/* Connecting ornamental lines */}
          <line x1="39" y1="53" x2="39" y2="59" stroke="#d4af37" strokeWidth="1.5" opacity="0.7" />
          
          {/* Corner flourishes */}
          <circle cx="18" cy="25" r="3" fill="none" stroke="#d4af37" strokeWidth="1.2" opacity="0.7" />
          <circle cx="60" cy="25" r="3" fill="none" stroke="#d4af37" strokeWidth="1.2" opacity="0.7" />
          <circle cx="18" cy="87" r="3" fill="none" stroke="#d4af37" strokeWidth="1.2" opacity="0.7" />
          <circle cx="60" cy="87" r="3" fill="none" stroke="#d4af37" strokeWidth="1.2" opacity="0.7" />
          
          {/* Side decorative elements */}
          <path 
            d="M 15 52 L 18 56 L 15 60" 
            fill="none" 
            stroke="#d4af37" 
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path 
            d="M 63 52 L 60 56 L 63 60" 
            fill="none" 
            stroke="#d4af37" 
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
        
        {/* Subtle corner details for premium look */}
        <g opacity="0.4">
          <path d="M 10 10 L 14 10 L 10 14 Z" fill="#d4af37" />
          <path d="M 68 10 L 64 10 L 68 14 Z" fill="#d4af37" />
          <path d="M 10 102 L 14 102 L 10 98 Z" fill="#d4af37" />
          <path d="M 68 102 L 64 102 L 68 98 Z" fill="#d4af37" />
        </g>
      </svg>
    );
  }

  // Geometric design - modern sharp angles
  if (design === 'geometric') {
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 78 112" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="geoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <pattern id="geoPattern" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M 0 7.5 L 7.5 0 L 15 7.5 L 7.5 15 Z" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        
        <rect width="78" height="112" rx="7" fill="url(#geoGrad)" stroke="#3b82f6" strokeWidth="2" />
        <rect x="5" y="5" width="68" height="102" rx="4" fill="url(#geoPattern)" />
        
        {/* Geometric pattern */}
        <g opacity="0.6" stroke="#60a5fa" strokeWidth="2" fill="none">
          <polygon points="39,20 52,35 39,50 26,35" />
          <polygon points="39,30 46,39 39,48 32,39" />
          <polygon points="39,62 52,77 39,92 26,77" />
          <polygon points="39,68 46,77 39,86 32,77" />
          <line x1="39" y1="50" x2="39" y2="62" strokeWidth="1.5" />
          
          {/* Corner triangles */}
          <polygon points="15,15 20,15 15,20" opacity="0.8" />
          <polygon points="63,15 63,20 58,15" opacity="0.8" />
          <polygon points="15,97 15,92 20,97" opacity="0.8" />
          <polygon points="63,97 58,97 63,92" opacity="0.8" />
        </g>
      </svg>
    );
  }

  // Diamond lattice design
  if (design === 'diamond') {
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 78 112" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="diamondGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#6b21a8" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>
          <pattern id="diamondPattern" x="0" y="0" width="12" height="21" patternUnits="userSpaceOnUse">
            <path d="M 6 0 L 12 10.5 L 6 21 L 0 10.5 Z" fill="none" stroke="#a78bfa" strokeWidth="0.6" opacity="0.4" />
          </pattern>
        </defs>
        
        <rect width="78" height="112" rx="7" fill="url(#diamondGrad)" stroke="#a78bfa" strokeWidth="2" />
        <rect x="5" y="5" width="68" height="102" rx="4" fill="url(#diamondPattern)" />
        
        {/* Central diamonds */}
        <g opacity="0.7" stroke="#c4b5fd" strokeWidth="2.5" fill="none">
          <path d="M 39 18 L 56 37 L 39 56 L 22 37 Z" strokeWidth="2" />
          <path d="M 39 24 L 50 37 L 39 50 L 28 37 Z" strokeWidth="1.5" opacity="0.7" />
          <path d="M 39 56 L 56 75 L 39 94 L 22 75 Z" strokeWidth="2" />
          <path d="M 39 62 L 50 75 L 39 88 L 28 75 Z" strokeWidth="1.5" opacity="0.7" />
        </g>
      </svg>
    );
  }

  // Hexagon pattern design
  if (design === 'hexagon') {
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 78 112" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <pattern id="hexPattern" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 9 2 L 15 6 L 15 12 L 9 16 L 3 12 L 3 6 Z" fill="none" stroke="#2dd4bf" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        
        <rect width="78" height="112" rx="7" fill="url(#hexGrad)" stroke="#14b8a6" strokeWidth="2" />
        <rect x="5" y="5" width="68" height="102" rx="4" fill="url(#hexPattern)" />
        
        {/* Hexagon pattern */}
        <g opacity="0.8" stroke="#5eead4" strokeWidth="2" fill="none">
          <path d="M 39 20 L 50 27 L 50 41 L 39 48 L 28 41 L 28 27 Z" />
          <path d="M 39 32 L 44 35 L 44 41 L 39 44 L 34 41 L 34 35 Z" opacity="0.6" />
          <path d="M 39 64 L 50 71 L 50 85 L 39 92 L 28 85 L 28 71 Z" />
          <path d="M 39 72 L 44 75 L 44 81 L 39 84 L 34 81 L 34 75 Z" opacity="0.6" />
        </g>
      </svg>
    );
  }

  // Wave pattern design
  if (design === 'wave') {
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 78 112" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
          <pattern id="wavePattern" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
            <path d="M 0 5 Q 5 2, 10 5 T 20 5" fill="none" stroke="#fda4af" strokeWidth="0.6" opacity="0.3" />
          </pattern>
        </defs>
        
        <rect width="78" height="112" rx="7" fill="url(#waveGrad)" stroke="#f43f5e" strokeWidth="2" />
        <rect x="5" y="5" width="68" height="102" rx="4" fill="url(#wavePattern)" />
        
        {/* Wave design */}
        <g opacity="0.7" stroke="#fda4af" strokeWidth="2.5" fill="none">
          <path d="M 12 30 Q 20 24, 28 30 T 44 30 T 60 30 T 66 30" />
          <path d="M 12 38 Q 20 32, 28 38 T 44 38 T 60 38 T 66 38" opacity="0.6" />
          <path d="M 12 56 Q 20 50, 28 56 T 44 56 T 60 56 T 66 56" />
          <path d="M 12 74 Q 20 68, 28 74 T 44 74 T 60 74 T 66 74" />
          <path d="M 12 82 Q 20 76, 28 82 T 44 82 T 60 82 T 66 82" opacity="0.6" />
          
          {/* Center circle accent */}
          <circle cx="39" cy="56" r="18" strokeWidth="2" />
          <circle cx="39" cy="56" r="12" strokeWidth="1.5" opacity="0.5" />
        </g>
      </svg>
    );
  }

  // Radial design
  // Pre-compute radiating line coordinates
  const radialLines = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 360) / 12;
      const rad = (angle * Math.PI) / 180;
      const x1 = 39 + 8 * Math.cos(rad);
      const y1 = 56 + 8 * Math.sin(rad);
      const x2 = 39 + 40 * Math.cos(rad);
      const y2 = 56 + 40 * Math.sin(rad);
      return { x1, y1, x2, y2 };
    });
  }, []);
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 78 112" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="radialGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
        <pattern id="radialPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="#fed7aa" opacity="0.2" />
        </pattern>
      </defs>
      
      <rect width="78" height="112" rx="7" fill="url(#radialGrad)" stroke="#fb923c" strokeWidth="2" />
      <rect x="5" y="5" width="68" height="102" rx="4" fill="url(#radialPattern)" />
      
      {/* Radial pattern */}
      <g opacity="0.8" stroke="#fed7aa" strokeWidth="2" fill="none">
        {/* Center point */}
        <circle cx="39" cy="56" r="4" fill="#fed7aa" />
        
        {/* Radiating circles */}
        <circle cx="39" cy="56" r="12" />
        <circle cx="39" cy="56" r="20" opacity="0.7" />
        <circle cx="39" cy="56" r="28" opacity="0.5" />
        <circle cx="39" cy="56" r="36" opacity="0.3" />
        
        {/* Radiating lines */}
        {radialLines.map((line, i) => (
          <line 
            key={`radial-line-${i}`}
            x1={line.x1} 
            y1={line.y1} 
            x2={line.x2} 
            y2={line.y2} 
            strokeWidth="1.2" 
            opacity="0.4" 
          />
        ))}
      </g>
    </svg>
  );
};

export default { PokerChipSVG, CardBackSVG };
