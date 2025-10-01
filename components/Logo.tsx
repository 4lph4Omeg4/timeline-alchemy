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
      {/* Mystical Logo with Cosmic Purple Theme */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{
            filter: 'drop-shadow(0 0 12px rgba(147, 51, 234, 0.6))'
          }}
        >
          {/* Cosmic Background Circle */}
          <defs>
            <radialGradient id="cosmicGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3"/>
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.1"/>
            </radialGradient>
            
            {/* Starfield Pattern */}
            <pattern id="starfield" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.5" fill="#9333ea" opacity="0.6"/>
              <circle cx="8" cy="6" r="0.3" fill="#a855f7" opacity="0.4"/>
              <circle cx="15" cy="3" r="0.4" fill="#c084fc" opacity="0.5"/>
              <circle cx="6" cy="12" r="0.2" fill="#9333ea" opacity="0.3"/>
              <circle cx="18" cy="15" r="0.6" fill="#7c3aed" opacity="0.4"/>
              <circle cx="12" cy="18" r="0.3" fill="#a855f7" opacity="0.5"/>
            </pattern>
          </defs>

          {/* Outer Cosmic Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#cosmicGradient)"
            stroke="#9333ea"
            strokeWidth="1"
            opacity="0.8"
          />

          {/* Starfield Background */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#starfield)"
            opacity="0.6"
          />

          {/* Hourglass Shape */}
          <g fill="url(#starfield)" stroke="#9333ea" strokeWidth="1.5">
            {/* Top Bulb */}
            <path
              d="M35 25 Q35 15 50 15 Q65 15 65 25 Q65 30 60 32 L50 35 L40 32 Q35 30 35 25 Z"
              opacity="0.9"
            />
            
            {/* Neck */}
            <rect x="47" y="35" width="6" height="8" opacity="0.8"/>
            
            {/* Bottom Bulb */}
            <path
              d="M35 75 Q35 85 50 85 Q65 85 65 75 Q65 70 60 68 L50 65 L40 68 Q35 70 35 75 Z"
              opacity="0.9"
            />
            
            {/* Top Cap */}
            <rect x="33" y="13" width="34" height="4" rx="2" opacity="0.8"/>
            
            {/* Bottom Cap */}
            <rect x="33" y="83" width="34" height="4" rx="2" opacity="0.8"/>
          </g>

          {/* Four-Pointed Stars on Circle */}
          <g fill="#9333ea" opacity="0.9">
            {/* Top Star */}
            <path d="M50 8 L51 12 L55 12 L52 15 L53 19 L50 16 L47 19 L48 15 L45 12 L49 12 Z"/>
            
            {/* Bottom Star */}
            <path d="M50 92 L51 88 L55 88 L52 85 L53 81 L50 84 L47 81 L48 85 L45 88 L49 88 Z"/>
            
            {/* Left Star */}
            <path d="M8 50 L12 49 L12 45 L15 48 L19 47 L16 50 L19 53 L15 52 L12 55 L12 51 Z"/>
            
            {/* Right Star */}
            <path d="M92 50 L88 49 L88 45 L85 48 L81 47 L84 50 L81 53 L85 52 L88 55 L88 51 Z"/>
          </g>

          {/* Additional Cosmic Stars */}
          <g fill="#a855f7" opacity="0.7">
            <circle cx="25" cy="25" r="1" opacity="0.6"/>
            <circle cx="75" cy="25" r="0.8" opacity="0.5"/>
            <circle cx="25" cy="75" r="0.6" opacity="0.7"/>
            <circle cx="75" cy="75" r="1.2" opacity="0.4"/>
            <circle cx="50" cy="20" r="0.5" opacity="0.8"/>
            <circle cx="50" cy="80" r="0.7" opacity="0.6"/>
            <circle cx="20" cy="50" r="0.9" opacity="0.5"/>
            <circle cx="80" cy="50" r="0.4" opacity="0.9"/>
          </g>

          {/* Mystical Glow Effect */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="#9333ea"
            strokeWidth="0.5"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Mystical Text */}
      {showText && (
        <div className={`mt-2 text-center font-serif font-bold ${textSizeClasses[size]} leading-tight`}>
          <div 
            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500"
            style={{
              textShadow: '0 0 8px rgba(147, 51, 234, 0.5)',
              filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.3))'
            }}
          >
            TIMELINE
          </div>
          <div 
            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 -mt-1"
            style={{
              textShadow: '0 0 8px rgba(147, 51, 234, 0.5)',
              filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.3))'
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