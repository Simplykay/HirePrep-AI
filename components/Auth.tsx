
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Alex');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleCredentialResponse = (response: any) => {
      setLoading(true);
      setTimeout(() => {
        onLogin({
          name: 'Alex',
          email: 'alex@example.com',
          isPremium: false,
          subscriptionTier: 'Free',
          interviewsCompleted: 0,
          history: [],
          avatarUrl: 'https://picsum.photos/seed/google-alex/100/100'
        });
        setLoading(false);
      }, 1000);
    };

    if ((window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        callback: handleCredentialResponse
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        { 
          theme: "filled_black", 
          size: "large", 
          width: 400,
          text: "continue_with" 
        }
      );
    }
  }, [onLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin && email === 'admin@gmail.com' && password === 'adminpass') {
      setTimeout(() => {
        onLogin({
          name: 'Admin User',
          email: 'admin@gmail.com',
          isPremium: true,
          subscriptionTier: 'Monthly',
          interviewsCompleted: 99,
          history: [],
          avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=10b981&color=fff'
        });
        setLoading(false);
      }, 800);
      return;
    }

    setTimeout(() => {
      onLogin({
        name: isLogin ? 'Alex' : name,
        email: email,
        isPremium: false,
        subscriptionTier: 'Free',
        interviewsCompleted: 0,
        history: []
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Side: Branding & Global Trust Signals */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-transparent to-black/20"></div>
        
        <div className="relative z-10">
          <div className="mb-12">
            <Logo className="h-10" />
          </div>
          
          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-extrabold text-white leading-tight">
              Master the interview, <span className="text-emerald-400">secure the role.</span>
            </h1>
            <p className="text-emerald-100/70 text-lg leading-relaxed">
              International standard preparation for the global job market. Analyze your profile against world-class benchmarks with industry-leading AI.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6">Trusted by candidates applying to global leaders</p>
          <div className="flex flex-wrap gap-8 opacity-60">
            <span className="text-white font-bold text-xl">Google</span>
            <span className="text-white font-bold text-xl">Amazon</span>
            <span className="text-white font-bold text-xl">Goldman Sachs</span>
            <span className="text-white font-bold text-xl">Stripe</span>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/2 right-[-10%] w-64 h-64 bg-emerald-400/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-slate-950 relative">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          {/* Form Top Logo */}
          <div className="flex flex-col items-center lg:items-start mb-2">
             <Logo className="h-10" variant="light" />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Sign in to HirePrep' : 'Join HirePrep AI'}
            </h2>
            <p className="text-slate-500">
              Welcome to the future of career preparation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Professional Email</label>
              <input
                type="email"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <span>{isLogin ? 'Sign In' : 'Get Started'}</span>}
            </button>
          </form>

          {isLogin && (
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2 flex items-center">
                <i className="fas fa-key mr-2"></i> Demo Credentials
              </p>
              <div className="flex justify-between text-xs text-slate-400">
                <p>Email: <span className="text-slate-200 select-all">admin@gmail.com</span></p>
                <p>Pass: <span className="text-slate-200 select-all">adminpass</span></p>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-3 text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div id="googleSignInButton" className="overflow-hidden rounded-xl"></div>
          </div>

          <p className="text-center text-sm text-slate-500">
            {isLogin ? "New to HirePrep?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors"
            >
              {isLogin ? 'Sign up for free' : 'Log in here'}
            </button>
          </p>

          <div className="pt-8 flex justify-center space-x-8 text-slate-600">
             <i className="fab fa-apple text-xl cursor-pointer hover:text-white transition-colors"></i>
             <i className="fab fa-github text-xl cursor-pointer hover:text-white transition-colors"></i>
             <i className="fab fa-linkedin text-xl cursor-pointer hover:text-white transition-colors"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
