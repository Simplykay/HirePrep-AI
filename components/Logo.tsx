
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ className = "h-12", showText = true, variant = 'light' }) => {
  const primaryColor = "#1e40af"; // Dark Blue / Navy from image
  const accentColor = "#3b82f6";  // Light Blue Arrow from image
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* SVG Monogram Icon */}
      <svg 
        viewBox="0 0 100 100" 
        className="h-full w-auto" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Rounded Box */}
        <rect 
          x="5" y="5" width="90" height="90" rx="18" 
          stroke={variant === 'light' ? 'white' : primaryColor} 
          strokeWidth="6" 
        />
        
        {/* The Arrow (Light Blue) */}
        <path 
          d="M30 65V35M30 35L22 43M30 35L38 43" 
          stroke={accentColor} 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* The HP/Gear Path (Dark Blue) */}
        <path 
          d="M45 70V30H65C73.2843 30 80 36.7157 80 45C80 53.2843 73.2843 60 65 60H45" 
          stroke={variant === 'light' ? '#60a5fa' : primaryColor} 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        <path 
          d="M75 45L85 45M72 32L78 26M72 58L78 64" 
          stroke={variant === 'light' ? '#60a5fa' : primaryColor} 
          strokeWidth="6" 
          strokeLinecap="round" 
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span className={`text-2xl font-bold tracking-tight ${textColor}`}>
          HirePrep
        </span>
      )}
    </div>
  );
};

export default Logo;
