import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Enhanced Mystical Logo with Arrow and Cosmic Elements */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(147, 51, 234, 0.7))'
          }}
        >
          <defs>
            {/* Cosmic Background Gradient */}
            <radialGradient id="cosmicBackground" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4"/>
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.2"/>
            </radialGradient>
            
            {/* Enhanced Starfield Pattern */}
            <pattern id="enhancedStarfield" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="#9333ea" opacity="0.8"/>
              <circle cx="8" cy="6" r="0.4" fill="#a855f7" opacity="0.6"/>
              <circle cx="12" cy="3" r="0.5" fill="#c084fc" opacity="0.7"/>
              <circle cx="6" cy="10" r="0.3" fill="#9333ea" opacity="0.5"/>
              <circle cx="13" cy="12" r="0.7" fill="#7c3aed" opacity="0.6"/>
              <circle cx="4" cy="8" r="0.4" fill="#a855f7" opacity="0.7"/>
              <circle cx="10" cy="1" r="0.2" fill="#9333ea" opacity="0.9"/>
              <circle cx="1" cy="12" r="0.5" fill="#c084fc" opacity="0.6"/>
            </pattern>

            {/* Glowing Purple Gradient */}
            <linearGradient id="glowingPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="1"/>
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8"/>
            </linearGradient>
          </defs>

          {/* Cosmic Background Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#cosmicBackground)"
            stroke="url(#glowingPurple)"
            strokeWidth="1.5"
            opacity="0.9"
          />

          {/* Enhanced Starfield Background */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#enhancedStarfield)"
            opacity="0.7"
          />

          {/* Hourglass Shape with Cosmic Sand */}
          <g fill="url(#enhancedStarfield)" stroke="url(#glowingPurple)" strokeWidth="2">
            {/* Top Bulb */}
            <path
              d="M35 25 Q35 15 50 15 Q65 15 65 25 Q65 30 60 32 L50 35 L40 32 Q35 30 35 25 Z"
              opacity="0.95"
            />
            
            {/* Neck */}
            <rect x="47" y="35" width="6" height="8" opacity="0.9"/>
            
            {/* Bottom Bulb */}
            <path
              d="M35 75 Q35 85 50 85 Q65 85 65 75 Q65 70 60 68 L50 65 L40 68 Q35 70 35 75 Z"
              opacity="0.95"
            />
            
            {/* Top Cap */}
            <rect x="33" y="13" width="34" height="4" rx="2" opacity="0.9"/>
            
            {/* Bottom Cap */}
            <rect x="33" y="83" width="34" height="4" rx="2" opacity="0.9"/>
          </g>

          {/* Arrow pointing to top star */}
          <path
            d="M35 50 Q40 45 45 40 Q50 35 55 40 Q60 45 65 50"
            stroke="url(#glowingPurple)"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
            markerEnd="url(#arrowhead)"
          />

          {/* Arrowhead */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="url(#glowingPurple)" opacity="0.8"/>
            </marker>
          </defs>

          {/* Four-Pointed Stars with Enhanced Glow */}
          <g fill="url(#glowingPurple)" opacity="1">
            {/* Top Star - Enhanced */}
            <path d="M50 8 L52 14 L58 14 L53 18 L55 24 L50 20 L45 24 L47 18 L42 14 L48 14 Z"/>
            
            {/* Bottom Star */}
            <path d="M50 92 L52 86 L58 86 L53 82 L55 76 L50 80 L45 76 L47 82 L42 86 L48 86 Z"/>
            
            {/* Left Star */}
            <path d="M8 50 L14 48 L14 42 L18 47 L24 45 L20 50 L24 55 L18 52 L14 58 L14 52 Z"/>
            
            {/* Right Star */}
            <path d="M92 50 L86 48 L86 42 L82 47 L76 45 L80 50 L76 55 L82 52 L86 58 L86 52 Z"/>
          </g>

          {/* Additional Cosmic Stars with Glow */}
          <g fill="#a855f7" opacity="0.8">
            <circle cx="25" cy="25" r="1.2" opacity="0.7"/>
            <circle cx="75" cy="25" r="1" opacity="0.6"/>
            <circle cx="25" cy="75" r="0.8" opacity="0.8"/>
            <circle cx="75" cy="75" r="1.4" opacity="0.5"/>
            <circle cx="50" cy="18" r="0.6" opacity="0.9"/>
            <circle cx="50" cy="82" r="0.9" opacity="0.7"/>
            <circle cx="18" cy="50" r="1.1" opacity="0.6"/>
            <circle cx="82" cy="50" r="0.5" opacity="1"/>
          </g>

          {/* Mystical Glow Rings */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="url(#glowingPurple)"
            strokeWidth="0.8"
            opacity="0.4"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#glowingPurple)"
            strokeWidth="0.5"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Enhanced Mystical Text */}
      {showText && (
        <div className={`mt-2 text-center font-serif font-bold ${textSizeClasses[size]} leading-tight`}>
          <div 
            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500"
            style={{
              textShadow: '0 0 12px rgba(147, 51, 234, 0.7)',
              filter: 'drop-shadow(0 0 6px rgba(147, 51, 234, 0.5))'
            }}
          >
            TIMELINE
          </div>
          <div 
            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 -mt-1"
            style={{
              textShadow: '0 0 12px rgba(147, 51, 234, 0.7)',
              filter: 'drop-shadow(0 0 6px rgba(147, 51, 234, 0.5))'
            }}
          >
            ALCHEMY
          </div>
        </div>
      )}
    </div>
  );
};

export { Logo };