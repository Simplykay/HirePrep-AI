
import React, { useState, useEffect, useCallback } from 'react';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const steps: TourStep[] = [
  {
    targetId: 'welcome-hero',
    title: 'Welcome to HirePrep!',
    content: 'This is your career command center. We help you prepare for top-tier international and regional roles.',
    position: 'bottom'
  },
  {
    targetId: 'competency-index',
    title: 'Your Growth Index',
    content: 'Track your overall competency. This score averages your performance across all mock interviews.',
    position: 'left'
  },
  {
    targetId: 'start-prep-btn',
    title: 'Start Your Journey',
    content: 'Launch a new session here. We will analyze your CV and the job description to tailor the interview.',
    position: 'top'
  },
  {
    targetId: 'performance-trend',
    title: 'Performance Tracking',
    content: 'Visualize your progress over time. Aim for a consistent upward trend to ensure you are ready for the real deal.',
    position: 'top'
  },
  {
    targetId: 'career-assistant-btn',
    title: '24/7 AI Support',
    content: 'Need help with your CV or career advice? Our AI Assistant is always here to help.',
    position: 'right'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const updateCoords = useCallback(() => {
    const step = steps[currentStep];
    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      // Scroll into view if not visible, but only if needed to avoid jumping
      const buffer = 100;
      if (rect.top < buffer || rect.bottom > window.innerHeight - buffer) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (step.position === 'center') {
      setCoords({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 });
    }
  }, [currentStep]);

  useEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, { passive: true });
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [updateCoords]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];

  // Calculate Card Position
  const getCardStyle = () => {
    const margin = 20;
    const cardWidth = 288; // w-72 = 18rem = 288px
    const cardHeight = 220; // estimate

    let top = coords.top;
    let left = coords.left + (coords.width / 2) - (cardWidth / 2);

    if (step.position === 'bottom') {
      top = coords.top + coords.height + margin;
    } else if (step.position === 'top') {
      top = coords.top - cardHeight - margin;
    } else if (step.position === 'left') {
      left = coords.left - cardWidth - margin;
      top = coords.top + (coords.height / 2) - (cardHeight / 2);
    } else if (step.position === 'right') {
      left = coords.left + coords.width + margin;
      top = coords.top + (coords.height / 2) - (cardHeight / 2);
    } else if (step.position === 'center') {
      top = (window.innerHeight / 2) - (cardHeight / 2);
      left = (window.innerWidth / 2) - (cardWidth / 2);
    }

    // Viewport safety
    top = Math.max(margin, Math.min(top, window.innerHeight - cardHeight - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));

    return {
      top: `${top}px`,
      left: `${left}px`,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      {/* SVG Spotlight Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={coords.left - 8} 
              y={coords.top - 8} 
              width={coords.width + 16} 
              height={coords.height + 16} 
              rx="12" 
              fill="black"
              style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </mask>
        </defs>
        <rect 
          x="0" y="0" width="100%" height="100%" 
          fill="rgba(2, 6, 23, 0.75)" 
          mask="url(#spotlight-mask)" 
          className="backdrop-blur-[2px]"
        />
      </svg>

      {/* Tour Card */}
      <div 
        className="absolute bg-slate-900 border border-slate-800 p-7 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-72 pointer-events-auto animate-slide-up ring-1 ring-white/5"
        style={getCardStyle()}
      >
        <h3 className="text-lg font-black text-white mb-2 leading-tight">{step.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-8">{step.content}</p>
        
        <div className="flex items-center justify-between pt-2">
          <button 
            onClick={handleSkip}
            className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
          >
            Skip
          </button>
          <button 
            onClick={handleNext}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
