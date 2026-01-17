
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ className = "h-12", showText = true, variant = 'light' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const primaryFill = variant === 'light' ? 'white' : '#0f172a';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="h-full w-auto overflow-visible" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
           <linearGradient id="brandGradient" x1="20" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" />
              <stop offset="1" stopColor="#3b82f6" />
           </linearGradient>
           <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
           </filter>
        </defs>

        {/* Global Circle - Representing Reach */}
        <circle 
          cx="50" cy="50" r="42" 
          stroke={primaryFill} 
          strokeWidth="1.5" 
          strokeOpacity="0.15" 
          strokeDasharray="4 4"
        />

        {/* Dynamic H Monogram */}
        {/* Left Vertical */}
        <path 
           d="M32 30V70" 
           stroke={primaryFill} 
           strokeWidth="7" 
           strokeLinecap="round" 
        />
        
        {/* Right Vertical (Top part is Arrow) */}
        <path 
           d="M68 30V70" 
           stroke={primaryFill} 
           strokeWidth="7" 
           strokeLinecap="round" 
           opacity="0.2"
        />

        {/* The Surge/Advancement Arrow */}
        <path 
           d="M32 60C45 60 55 50 68 30" 
           stroke="url(#brandGradient)" 
           strokeWidth="7" 
           strokeLinecap="round"
           filter="url(#glow)" 
        />
        
        {/* Arrow Head */}
        <path 
           d="M58 30H68V40" 
           stroke="url(#brandGradient)" 
           strokeWidth="7" 
           strokeLinecap="round" 
           strokeLinejoin="round" 
        />
      </svg>
      
      {showText && (
        <div className="flex flex-col justify-center -space-y-0.5">
          <span className={`text-xl font-extrabold tracking-tight ${textColor}`}>
            HirePrep
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
            Global AI
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
