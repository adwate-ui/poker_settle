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
      className="block"
    >
      <defs>
        {/* Colors & Gradients */}
        <linearGradient id="gold-foil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="25%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <radialGradient id="card-sheen" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        {/* Guilloche Pattern */}
        <pattern id="guilloche" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#450a0a" /> {/* Deep Burgundy Background */}
          <path
            d="M 6 0 L 12 6 L 6 12 L 0 6 Z M 0 0 L 3 3 M 12 0 L 9 3 M 0 12 L 3 9 M 12 12 L 9 9"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.2"
            opacity="0.3"
          />
          <circle cx="6" cy="6" r="1.5" fill="none" stroke="#fbbf24" strokeWidth="0.1" opacity="0.2" />
        </pattern>

        {/* Linen Texture Filter */}
        <filter id="linen-texture" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.1 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* 1. Outer White Border (5% width) */}
      <rect width="78" height="112" rx="6" fill="white" />

      {/* 2. Main Card Body Container */}
      <g transform="translate(4, 4)">
        <rect width="70" height="104" rx="3" fill="url(#guilloche)" />

        {/* 3. Metallic Gold Pinstripe */}
        <rect
          x="1"
          y="1"
          width="68"
          height="102"
          rx="2.5"
          fill="none"
          stroke="url(#gold-foil)"
          strokeWidth="0.8"
          opacity="0.9"
        />

        {/* 4. Texture Overlay */}
        <rect width="70" height="104" rx="3" filter="url(#linen-texture)" pointerEvents="none" opacity="0.4" />

        {/* 5. Centerpiece Medallion */}
        <g transform="translate(35, 52)">
          {/* Main Flourish (Double-ended Symmetrical) */}
          <path
            d="M -15 -8 C -10 -15, 10 -15, 15 -8 C 10 -4, -10 -4, -15 -8 Z 
               M -15 8 C -10 15, 10 15, 15 8 C 10 4, -10 4, -15 8 Z
               M -6 0 C -12 -6, -12 6, -6 0 Z
               M 6 0 C 12 -6, 12 6, 6 0 Z"
            fill="url(#gold-foil)"
            filter="drop-shadow(0 1px 1px rgba(0,0,0,0.5))"
          />
          {/* Central Diamond Accent */}
          <path d="M 0 -5 L 4 0 L 0 5 L -4 0 Z" fill="url(#gold-foil)" />
          {/* Inner Rings */}
          <circle cx="0" cy="0" r="18" fill="none" stroke="url(#gold-foil)" strokeWidth="0.3" opacity="0.4" />
          <circle cx="0" cy="0" r="14" fill="none" stroke="url(#gold-foil)" strokeWidth="0.1" opacity="0.2" />
        </g>

        {/* 6. Surface Sheen */}
        <rect width="70" height="104" rx="3" fill="url(#card-sheen)" pointerEvents="none" />
      </g>
    </svg>
  );
};

export default { PokerChipSVG, CardBackSVG };
