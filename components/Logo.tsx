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

  const radiusSize = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 120
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo with radiating lines */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Radiating sunburst lines */}
        <svg
          viewBox={`-${radiusSize[size]} -${radiusSize[size]} ${radiusSize[size] * 2} ${radiusSize[size] * 2}`}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scale(1.8)' }}
        >
          {/* Generate radiating lines */}
          {[...Array(24)].map((_, i) => {
            const angle = (i * 15) * Math.PI / 180;
            const x1 = Math.cos(angle) * (radiusSize[size] * 0.4);
            const y1 = Math.sin(angle) * (radiusSize[size] * 0.4);
            const x2 = Math.cos(angle) * (radiusSize[size] * 0.7);
            const y2 = Math.sin(angle) * (radiusSize[size] * 0.7);
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#D4AF37"
                strokeWidth="1.5"
                opacity="0.8"
              />
            );
          })}
        </svg>

        {/* Main hourglass */}
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full relative z-10"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))'
          }}
        >
          {/* Hourglass outline */}
          <path
            d="M20 10 L80 10 L80 20 Q80 35 65 40 L50 50 L65 60 Q80 65 80 80 L80 110 L20 110 L20 80 Q20 65 35 60 L50 50 L35 40 Q20 35 20 20 L20 10 Z"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2"
          />
          
          {/* Top and bottom caps */}
          <rect x="18" y="8" width="64" height="4" fill="#D4AF37" rx="2"/>
          <rect x="18" y="108" width="64" height="4" fill="#D4AF37" rx="2"/>
          
          {/* South America-shaped sand in top bulb */}
          <path
            d="M45 25 Q50 20 55 25 Q60 30 58 35 L56 38 Q52 40 48 38 L42 35 Q40 30 42 28 Q43 26 45 25 Z"
            fill="#DEB887"
            opacity="0.9"
          />
          
          {/* Additional sand texture in top */}
          <circle cx="35" cy="22" r="1.5" fill="#D4AF37" opacity="0.7"/>
          <circle cx="65" cy="28" r="1" fill="#D4AF37" opacity="0.6"/>
          <circle cx="40" cy="32" r="0.8" fill="#DEB887" opacity="0.8"/>
          <circle cx="60" cy="35" r="1.2" fill="#DEB887" opacity="0.7"/>

          {/* Falling sand through neck */}
          <path
            d="M48 42 Q50 45 52 48 Q50 52 48 55"
            stroke="#DEB887"
            strokeWidth="0.8"
            fill="none"
            opacity="0.6"
          />
          
          {/* Sand accumulation in bottom */}
          <path
            d="M25 95 Q35 85 50 88 Q65 85 75 95 L75 105 L25 105 Z"
            fill="#DEB887"
            opacity="0.8"
          />
          
          {/* Four-pointed stars in top bulb */}
          <g fill="#D4AF37" opacity="0.8">
            <path d="M30 18 L31 20 L33 19 L31 21 L30 23 L29 21 L27 19 L29 20 Z"/>
            <path d="M70 25 L71 27 L73 26 L71 28 L70 30 L69 28 L67 26 L69 27 Z"/>
            <path d="M50 15 L51.5 17 L54 16 L51.5 18.5 L50 21 L48.5 18.5 L46 16 L48.5 17 Z"/>
          </g>
          
          {/* Four-pointed stars in bottom bulb */}
          <g fill="#D4AF37" opacity="0.8">
            <path d="M35 75 L36 77 L38 76 L36 78 L35 80 L34 78 L32 76 L34 77 Z"/>
            <path d="M65 82 L66 84 L68 83 L66 85 L65 87 L64 85 L62 83 L64 84 Z"/>
            <path d="M50 70 L51.5 72 L54 71 L51.5 73.5 L50 76 L48.5 73.5 L46 71 L48.5 72 Z"/>
          </g>

          {/* Additional mystical dots */}
          <circle cx="25" cy="25" r="0.8" fill="#D4AF37" opacity="0.6"/>
          <circle cx="75" cy="32" r="0.6" fill="#D4AF37" opacity="0.5"/>
          <circle cx="30" cy="85" r="0.7" fill="#D4AF37" opacity="0.6"/>
          <circle cx="70" cy="90" r="0.9" fill="#D4AF37" opacity="0.5"/>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className={`mt-2 text-center font-serif font-bold ${textSizeClasses[size]} text-gray-900 dark:text-gray-100 leading-tight`}>
          <div className="text-yellow-700 dark:text-yellow-300">TIMELINE</div>
          <div className="text-yellow-700 dark:text-yellow-300 -mt-1">ALCHEMY</div>
        </div>
      )}
    </div>
  );
};

export { Logo };