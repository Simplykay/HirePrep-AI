
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  requiredTier: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, featureName, requiredTier }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
        
        <div className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
            <i className="fas fa-lock text-2xl text-amber-500"></i>
          </div>

          <div>
            <h3 className="text-xl font-black text-white mb-2">Unlock {featureName}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              This advanced feature is available on the <span className="text-emerald-400 font-bold">{requiredTier}</span> plan and above. Upgrade your career arsenal today.
            </p>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 text-left space-y-3">
             <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Included in Pro:</p>
             <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                   <i className="fas fa-check-circle text-emerald-500"></i>
                   <span>Unlimited AI Analysis</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                   <i className="fas fa-check-circle text-emerald-500"></i>
                   <span>Global Market Intelligence</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                   <i className="fas fa-check-circle text-emerald-500"></i>
                   <span>LinkedIn Profile Integration</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onClose();
                navigate('/pricing');
              }}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/40 active:scale-95 flex items-center justify-center space-x-2"
            >
              <i className="fas fa-rocket"></i>
              <span>View Upgrade Options</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-slate-500 hover:text-white font-bold text-xs transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
