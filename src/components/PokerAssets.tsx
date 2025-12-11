// SVG-based poker chip and card back assets
// These are inline SVG components that are much smaller and scale perfectly

export const PokerChipSVG = ({ 
  value, 
  color, 
  size = 64 
}: { 
  value: string; 
  color: string; 
  size?: number 
}) => {
  const colorSchemes: Record<string, { primary: string; secondary: string; text: string }> = {
    black: { primary: '#1a1a1a', secondary: '#333', text: '#fff' },
    red: { primary: '#dc2626', secondary: '#991b1b', text: '#fff' },
    blue: { primary: '#2563eb', secondary: '#1e40af', text: '#fff' },
    green: { primary: '#16a34a', secondary: '#15803d', text: '#fff' },
    yellow: { primary: '#eab308', secondary: '#ca8a04', text: '#000' },
    white: { primary: '#f5f5f5', secondary: '#d4d4d4', text: '#000' },
  };

  const scheme = colorSchemes[color] || colorSchemes.white;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="50" cy="50" r="48" fill={scheme.primary} stroke="#000" strokeWidth="1" />
      
      {/* Edge pattern */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        const x1 = 50 + 44 * Math.cos((angle * Math.PI) / 180);
        const y1 = 50 + 44 * Math.sin((angle * Math.PI) / 180);
        const x2 = 50 + 38 * Math.cos((angle * Math.PI) / 180);
        const y2 = 50 + 38 * Math.sin((angle * Math.PI) / 180);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={scheme.secondary}
            strokeWidth="2"
          />
        );
      })}
      
      {/* Inner circle */}
      <circle cx="50" cy="50" r="35" fill={scheme.secondary} />
      
      {/* Center circle */}
      <circle cx="50" cy="50" r="28" fill={scheme.primary} />
      
      {/* Value text */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill={scheme.text}
        fontSize="18"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {value}
      </text>
      
      {/* Small value indicators */}
      {[0, 90, 180, 270].map((angle) => {
        const x = 50 + 20 * Math.cos((angle * Math.PI) / 180);
        const y = 50 + 20 * Math.sin((angle * Math.PI) / 180);
        return (
          <text
            key={angle}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={scheme.text}
            fontSize="8"
            fontWeight="bold"
          >
            {value}
          </text>
        );
      })}
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
      {/* Card background */}
      <rect 
        width="78" 
        height="112" 
        rx="6" 
        fill="#0D5D2A" 
        stroke="#0A4821" 
        strokeWidth="2"
      />
      
      {/* Inner border */}
      <rect 
        x="4" 
        y="4" 
        width="70" 
        height="104" 
        rx="4" 
        fill="none" 
        stroke="#0F6B32" 
        strokeWidth="1"
      />
      
      {/* Decorative pattern */}
      <g opacity="0.3">
        {/* Diamond pattern */}
        <path 
          d="M 39 20 L 49 30 L 39 40 L 29 30 Z" 
          fill="none" 
          stroke="#fff" 
          strokeWidth="1.5"
        />
        <path 
          d="M 39 42 L 49 52 L 39 62 L 29 52 Z" 
          fill="none" 
          stroke="#fff" 
          strokeWidth="1.5"
        />
        <path 
          d="M 39 72 L 49 82 L 39 92 L 29 82 Z" 
          fill="none" 
          stroke="#fff" 
          strokeWidth="1.5"
        />
        
        {/* Side patterns */}
        <circle cx="15" cy="30" r="4" fill="none" stroke="#fff" strokeWidth="1" />
        <circle cx="63" cy="30" r="4" fill="none" stroke="#fff" strokeWidth="1" />
        <circle cx="15" cy="56" r="4" fill="none" stroke="#fff" strokeWidth="1" />
        <circle cx="63" cy="56" r="4" fill="none" stroke="#fff" strokeWidth="1" />
        <circle cx="15" cy="82" r="4" fill="none" stroke="#fff" strokeWidth="1" />
        <circle cx="63" cy="82" r="4" fill="none" stroke="#fff" strokeWidth="1" />
      </g>
    </svg>
  );
};

export default { PokerChipSVG, CardBackSVG };
