
import React from 'react';
import { UserProfile, SubscriptionTier } from '../types';

interface PricingProps {
  user: UserProfile;
  onUpgrade: (tier: SubscriptionTier) => void;
}

const Pricing: React.FC<PricingProps> = ({ user, onUpgrade }) => {
  const plans = [
    {
      tier: 'Free' as SubscriptionTier,
      name: 'Free Tier',
      price: '0',
      period: '',
      description: 'Casual prep for students.',
      features: [
        '1 Mock session daily',
        'Basic CV analysis',
        'Email feedback'
      ],
      color: 'slate',
    },
    {
      tier: 'Weekly' as SubscriptionTier,
      name: 'Weekly Sprint',
      price: '2,500',
      period: '/wk',
      description: 'Intensive last-minute prep.',
      features: [
        'Unlimited sessions',
        'Deep-dive analysis',
        'Voice interaction',
        'PDF Export'
      ],
      color: 'blue',
    },
    {
      tier: 'Monthly' as SubscriptionTier,
      name: 'Pro Monthly',
      price: '4,500',
      period: '/mo',
      description: 'Consistent career growth.',
      features: [
        'Everything in Weekly',
        'Regional market data',
        'Salary benchmarks',
        'Priority support'
      ],
      color: 'emerald',
      popular: true
    },
    {
      tier: 'Yearly' as SubscriptionTier,
      name: 'Yearly Legend',
      price: '40,000',
      period: '/yr',
      description: 'The long-term career play.',
      features: [
        'Everything in Monthly',
        '1-on-1 AI mentorship',
        'Early beta access',
        'Save ₦14,000 yearly'
      ],
      color: 'amber',
    }
  ];

  const getColorClasses = (color: string, active: boolean) => {
    switch(color) {
      case 'emerald': return active ? 'border-emerald-500 bg-emerald-900/10 shadow-emerald-900/20' : 'border-slate-800 hover:border-emerald-800';
      case 'blue': return active ? 'border-blue-500 bg-blue-900/10 shadow-blue-900/20' : 'border-slate-800 hover:border-blue-800';
      case 'amber': return active ? 'border-amber-500 bg-amber-900/10 shadow-amber-900/20' : 'border-slate-800 hover:border-amber-800';
      default: return active ? 'border-slate-400 bg-slate-800/50' : 'border-slate-800 hover:border-slate-700';
    }
  };

  const getButtonClasses = (color: string, isCurrent: boolean) => {
    if (isCurrent) return 'bg-slate-800 text-slate-500 cursor-default';
    switch(color) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20';
      case 'blue': return 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20';
      case 'amber': return 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20';
      default: return 'bg-slate-700 hover:bg-slate-600 text-white';
    }
  };

  return (
    <div className="py-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-100">Fuel Your Ambition</h2>
        <p className="text-slate-500 text-lg">Choose a plan that matches your interview timeline. Trusted by candidates across the continent.</p>
        
        <div className="flex items-center justify-center space-x-6 pt-4 grayscale opacity-40">
          <div className="flex items-center space-x-1">
             <i className="fas fa-credit-card text-xs"></i>
             <span className="text-[10px] font-bold tracking-widest uppercase">Paystack</span>
          </div>
          <div className="flex items-center space-x-1">
             <i className="fas fa-money-bill-wave text-xs"></i>
             <span className="text-[10px] font-bold tracking-widest uppercase">Flutterwave</span>
          </div>
          <div className="flex items-center space-x-1">
             <i className="fas fa-mobile-alt text-xs"></i>
             <span className="text-[10px] font-bold tracking-widest uppercase">Mobile Money</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = user.subscriptionTier === plan.tier;
          return (
            <div 
              key={plan.name} 
              className={`relative p-6 rounded-3xl border flex flex-col transition-all duration-300 transform hover:-translate-y-1 ${getColorClasses(plan.color, isCurrent)} ${plan.popular ? 'lg:scale-105 z-10' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                  Recommended
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1 text-slate-100">{plan.name}</h3>
                <p className="text-slate-500 text-xs mb-4 min-h-[32px]">{plan.description}</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xs font-bold text-slate-400">₦</span>
                  <span className="text-3xl font-extrabold text-slate-100">{plan.price}</span>
                  <span className="text-slate-500 text-xs">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-[11px]">
                    <i className={`fas fa-check-circle mt-0.5 ${isCurrent ? 'text-emerald-400' : 'text-slate-600'}`}></i>
                    <span className="text-slate-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onUpgrade(plan.tier)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${getButtonClasses(plan.color, isCurrent)}`}
              >
                {isCurrent ? 'Active Plan' : `Get ${plan.tier}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl max-w-4xl mx-auto border border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-globe-africa text-9xl"></i>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
                <h4 className="text-xl font-bold mb-4 text-slate-100">Regional Payment Options</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                    We support local payment gateways in Nigeria, Ghana, Kenya, and South Africa. 
                    Pay seamlessly with your local bank card, USSD, or Mobile Money (M-Pesa, MTN MoMo).
                </p>
                <div className="flex space-x-4 mt-6">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-1">
                            <i className="fas fa-shield-alt text-emerald-500"></i>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Secure</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-1">
                            <i className="fas fa-bolt text-blue-500"></i>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Instant</span>
                    </div>
                </div>
            </div>
            <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                <h5 className="font-bold text-sm mb-4 text-slate-300">Why upgrade?</h5>
                <ul className="space-y-3">
                    <li className="flex items-center space-x-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span>Unlocks AI voice interaction for realistic mocks.</span>
                    </li>
                    <li className="flex items-center space-x-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Regional demographics for location-based questions.</span>
                    </li>
                    <li className="flex items-center space-x-3 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                        <span>High-res PDF reports for interviewers or record.</span>
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
