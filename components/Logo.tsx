import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Hourglass Icon */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full text-yellow-500 drop-shadow-lg"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))'
          }}
        >
          {/* Hourglass outline */}
          <path
            d="M12 2C8.5 2 6 4.5 6 8v1c0 1.5.5 2.5 1.5 3.5L12 16l4.5-3.5C17.5 11.5 18 10.5 18 9V8c0-3.5-2.5-6-6-6z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M12 22c3.5 0 6-2.5 6-6v-1c0-1.5-.5-2.5-1.5-3.5L12 8l-4.5 3.5C6.5 12.5 6 13.5 6 15v1c0 3.5 2.5 6 6 6z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          
          {/* Sand particles in upper bulb */}
          <circle cx="10" cy="6" r="0.5" fill="currentColor" opacity="0.8" />
          <circle cx="14" cy="7" r="0.5" fill="currentColor" opacity="0.6" />
          <circle cx="11" cy="5" r="0.3" fill="currentColor" opacity="0.9" />
          
          {/* Sand particles in lower bulb */}
          <circle cx="13" cy="18" r="0.5" fill="currentColor" opacity="0.8" />
          <circle cx="9" cy="19" r="0.5" fill="currentColor" opacity="0.6" />
          <circle cx="12" cy="17" r="0.3" fill="currentColor" opacity="0.9" />
          
          {/* Falling sand stream */}
          <path
            d="M12 9L12 15"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.7"
          />
        </svg>
        
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
            filter: 'blur(2px)'
          }}
        />
      </div>

      {/* Text */}
      {showText && (
        <div className={`font-bold ${textSizeClasses[size]} text-gray-900 dark:text-white`}>
          <div className="leading-tight">
            <span className="text-yellow-600 dark:text-yellow-400">TIMELINE</span>
          </div>
          <div className="leading-tight -mt-1">
            <span className="text-yellow-600 dark:text-yellow-400">ALCHEMY</span>
          </div>
        </div>
      )}
    </div>
  );
};

export { Logo };
