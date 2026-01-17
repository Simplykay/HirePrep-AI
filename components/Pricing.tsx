
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile, SubscriptionTier } from '../types';

interface PricingProps {
  user: UserProfile;
  onUpgrade: (tier: SubscriptionTier) => void;
}

const Pricing: React.FC<PricingProps> = ({ user, onUpgrade }) => {
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      tier: 'Free' as SubscriptionTier,
      name: 'Free Tier',
      price: '0',
      usdPrice: '0',
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
      usdPrice: '5',
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
      price: '7,500',
      usdPrice: '15',
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
      usdPrice: '80',
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

  const handleCheckoutInitiation = (plan: any) => {
    if (plan.tier === 'Free') {
      onUpgrade('Free');
      return;
    }
    setSelectedPlan(plan);
  };

  const simulatePayment = (method: 'paypal' | 'local') => {
    setIsProcessing(true);
    // Simulate gateway redirect
    setTimeout(() => {
      onUpgrade(selectedPlan.tier);
      setIsProcessing(false);
      setSelectedPlan(null);
    }, 2000);
  };

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
      <div className="flex justify-start px-4">
        <Link to="/" className="text-xs font-black text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-[0.2em] flex items-center space-x-3 group bg-slate-900/50 py-2 px-4 rounded-full border border-slate-800">
          <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-100 tracking-tight">Fuel Your Ambition</h2>
        <p className="text-slate-500 text-lg leading-relaxed">Choose a plan that matches your interview timeline. Secure payments supported globally.</p>
        
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 grayscale opacity-40 hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center space-x-1.5">
             <i className="fab fa-paypal text-blue-500 text-sm"></i>
             <span className="text-[10px] font-bold tracking-widest uppercase">PayPal</span>
          </div>
          <div className="flex items-center space-x-1.5">
             <i className="fas fa-credit-card text-emerald-500 text-xs"></i>
             <span className="text-[10px] font-bold tracking-widest uppercase">Paystack</span>
          </div>
          <div className="flex items-center space-x-1.5">
             <i className="fas fa-bolt text-amber-500 text-xs"></i>
             <span className="text-[10px] font-bold tracking-widest uppercase">Flutterwave</span>
          </div>
          <div className="flex items-center space-x-1.5">
             <i className="fas fa-mobile-alt text-blue-400 text-xs"></i>
             <span className="text-[10px] font-bold tracking-widest uppercase">MoMo / M-Pesa</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = user.subscriptionTier === plan.tier;
          return (
            <div 
              key={plan.name} 
              className={`relative p-7 rounded-3xl border flex flex-col transition-all duration-300 transform hover:-translate-y-1 ${getColorClasses(plan.color, isCurrent)} ${plan.popular ? 'lg:scale-105 z-10' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                  Most Popular
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
                {plan.usdPrice !== '0' && (
                   <p className="text-[10px] font-bold text-slate-600 mt-1">Approx. ${plan.usdPrice} USD</p>
                )}
              </div>

              <ul className="space-y-3.5 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-[11px]">
                    <i className={`fas fa-check-circle mt-0.5 ${isCurrent ? 'text-emerald-400' : 'text-slate-600'}`}></i>
                    <span className="text-slate-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckoutInitiation(plan)}
                disabled={isCurrent}
                className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all ${getButtonClasses(plan.color, isCurrent)}`}
              >
                {isCurrent ? 'Current Plan' : `Upgrade to ${plan.tier}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Selection Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-white">Complete Upgrade</h4>
                  <p className="text-slate-500 text-sm mt-1">Securely pay for your {selectedPlan.name} plan.</p>
                </div>
                <button 
                  onClick={() => setSelectedPlan(null)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-400">Total Amount</span>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">₦{selectedPlan.price}</p>
                  <p className="text-xs text-slate-500">~ ${selectedPlan.usdPrice}.00 USD</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Payment Method</p>
                
                {/* PayPal Option */}
                <button 
                  onClick={() => simulatePayment('paypal')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-4 bg-[#003087]/10 border border-[#003087]/30 rounded-2xl hover:bg-[#003087]/20 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center text-white">
                      <i className="fab fa-paypal text-xl"></i>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">PayPal / Cards</p>
                      <p className="text-[10px] text-slate-400">International Payment Gateway</p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-slate-600 group-hover:translate-x-1 transition-transform"></i>
                </button>

                {/* Local African Gateway */}
                <button 
                  onClick={() => simulatePayment('local')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl hover:bg-emerald-500/20 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                      <i className="fas fa-globe-africa text-xl"></i>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Paystack / MoMo</p>
                      <p className="text-[10px] text-slate-400">Africa Local Payments (NGN, GHS, KES)</p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-slate-600 group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center space-x-3 p-4 bg-slate-800/50 rounded-2xl">
                  <i className="fas fa-spinner fa-spin text-emerald-500"></i>
                  <span className="text-xs font-bold text-slate-300">Connecting to secure gateway...</span>
                </div>
              )}
            </div>
            
            <div className="bg-slate-950 p-6 flex items-center justify-center space-x-6 opacity-40">
               <i className="fab fa-cc-visa text-2xl"></i>
               <i className="fab fa-cc-mastercard text-2xl"></i>
               <i className="fab fa-cc-amex text-2xl"></i>
               <i className="fab fa-cc-apple-pay text-2xl"></i>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 p-8 md:p-12 rounded-3xl max-w-4xl mx-auto border border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-globe-americas text-9xl"></i>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <h4 className="text-2xl font-bold mb-4 text-slate-100">Global & Local Standards</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    HirePrep is built for the international candidate. We support payments from 130+ countries via PayPal and Stripe, 
                    while offering deep local integration for our users across the African continent.
                </p>
                <div className="flex space-x-6">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-2 border border-slate-700">
                            <i className="fas fa-lock text-emerald-500"></i>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">256-bit SSL</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-2 border border-slate-700">
                            <i className="fas fa-history text-blue-500"></i>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Money Back</span>
                    </div>
                </div>
            </div>
            <div className="bg-slate-950/50 p-8 rounded-2xl border border-slate-800 relative">
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl">
                   <i className="fas fa-plane-departure"></i>
                </div>
                <h5 className="font-bold text-sm mb-4 text-slate-300">Why upgrade?</h5>
                <ul className="space-y-4">
                    <li className="flex items-center space-x-4 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Full AI voice interaction (International Accents).</span>
                    </li>
                    <li className="flex items-center space-x-4 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Salary insights for US, UK, and European markets.</span>
                    </li>
                    <li className="flex items-center space-x-4 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span>Unlimited deep-dive CV optimizations.</span>
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
