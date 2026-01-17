
import React, { useState, useEffect } from 'react';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
  onComplete: () => void;
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

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const updateCoords = () => {
      const step = steps[currentStep];
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (step.position === 'center') {
        setCoords({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 });
      }
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [currentStep]);

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

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop with hole */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${coords.left}px 100%, 
            ${coords.left}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top + coords.height}px, 
            ${coords.left}px ${coords.top + coords.height}px, 
            ${coords.left}px 100%, 
            100% 100%, 
            100% 0%
          )`
        }}
      />

      {/* Tour Card */}
      <div 
        className="absolute bg-slate-900 border border-emerald-500/30 p-6 rounded-[2rem] shadow-2xl w-72 pointer-events-auto animate-slide-up"
        style={{
          top: step.position === 'bottom' ? coords.top + coords.height + 20 : 
               step.position === 'top' ? coords.top - 200 : 
               step.position === 'center' ? window.innerHeight / 2 - 100 : 
               coords.top,
          left: step.position === 'left' ? coords.left - 300 : 
                step.position === 'right' ? coords.left + coords.width + 20 : 
                step.position === 'center' ? window.innerWidth / 2 - 144 :
                coords.left + (coords.width / 2) - 144,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Guide {currentStep + 1}/{steps.length}</span>
        </div>
        <h3 className="text-lg font-black text-white mb-2">{step.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">{step.content}</p>
        
        <div className="flex items-center justify-between">
          <button 
            onClick={handleSkip}
            className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            Skip Tour
          </button>
          <button 
            onClick={handleNext}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
