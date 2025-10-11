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
      {/* New TA Logo - Clean and Minimalist */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
        >
          {/* Black background */}
          <rect width="100" height="100" fill="#000000"/>
          
          {/* White square with rounded corners */}
          <rect x="20" y="20" width="60" height="60" rx="15" ry="15" fill="#ffffff"/>
          
          {/* TA letters */}
          <text 
            x="50" 
            y="65" 
            fontFamily="Arial, sans-serif" 
            fontSize="32" 
            fontWeight="bold" 
            textAnchor="middle" 
            fill="#000000"
          >
            TA
          </text>
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