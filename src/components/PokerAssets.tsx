// SVG-based poker chip and card back assets
// These are inline SVG components that are much smaller and scale perfectly

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

export const CardBackSVG = ({ width = 78, height = 112 }: { width?: number; height?: number }) => {
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
};

export default { PokerChipSVG, CardBackSVG };
