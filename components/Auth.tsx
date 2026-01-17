
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
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize Google Sign-In if available
    if ((window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        callback: handleGoogleCredentialResponse
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

  const handleGoogleCredentialResponse = (response: any) => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        name: 'Google User',
        email: 'user@google.com',
        isPremium: false,
        subscriptionTier: 'Free',
        interviewsCompleted: 0,
        history: [],
        avatarUrl: 'https://ui-avatars.com/api/?name=Google+User&background=random&color=fff'
      });
      setLoading(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Fetch registered users from localStorage
    const storedUsersRaw = localStorage.getItem('hireprep_registered_users');
    const users = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

    if (isLogin) {
      // Login Logic
      // Hardcoded Admin for ease of testing
      if (email === 'admin@gmail.com' && password === 'adminpass') {
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
        }, 1000);
        return;
      }

      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        setTimeout(() => {
          onLogin({
            ...user,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`
          });
          setLoading(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setError('Invalid email or password. Please try again or create an account.');
          setLoading(false);
        }, 1000);
      }
    } else {
      // Sign Up Logic
      if (users.some((u: any) => u.email === email)) {
        setError('A user with this email already exists.');
        setLoading(false);
        return;
      }

      const newUser = {
        name,
        email,
        password,
        isPremium: false,
        subscriptionTier: 'Free',
        interviewsCompleted: 0,
        history: []
      };

      users.push(newUser);
      localStorage.setItem('hireprep_registered_users', JSON.stringify(users));

      setTimeout(() => {
        onLogin({
          ...newUser,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
        });
        setLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      {/* Brand Column */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-emerald-950 relative">
        <div className="absolute inset-0 pattern-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-transparent to-black/40"></div>
        
        <div className="relative z-10">
          <Logo className="h-12 mb-16" />
          <div className="max-w-md space-y-8">
            <h1 className="text-6xl font-black text-white leading-none tracking-tight">
              Unlock Your <span className="text-emerald-400">Global</span> Potential.
            </h1>
            <p className="text-emerald-100/60 text-xl leading-relaxed">
              Empowering African professionals with world-class AI interview training tailored for international success.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-4">
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <img key={i} className="w-10 h-10 rounded-full border-2 border-emerald-900" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
            ))}
          </div>
          <p className="text-emerald-300/80 text-sm font-medium">Join 50,000+ professionals prepping for global roles.</p>
        </div>
      </div>

      {/* Auth Form Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950 relative">
        <div className="w-full max-w-md space-y-10 animate-slide-up">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo className="h-10" variant="light" />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-white mb-3">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Welcome back! Ready for your session?' : 'Start your journey to international job offers today.'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center space-x-3 animate-fade-in">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                  placeholder="e.g. Chinua Achebe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Work Email</label>
              <input
                type="email"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              {isLogin ? 'Sign In Now' : 'Create My Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-slate-950 px-4 text-slate-600 font-black tracking-widest">Secure Entry</span></div>
          </div>

          <div className="flex justify-center">
            <div id="googleSignInButton" className="overflow-hidden rounded-xl"></div>
          </div>

          <p className="text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already a member?"}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-emerald-500 font-bold hover:underline"
            >
              {isLogin ? 'Sign up for free' : 'Log in here'}
            </button>
          </p>
          
          {isLogin && (
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <p className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-2 flex items-center">
                <i className="fas fa-key mr-2"></i> Demo Access
              </p>
              <div className="flex justify-between text-[11px] text-slate-500">
                <p>Email: <span className="text-slate-200 font-mono">admin@gmail.com</span></p>
                <p>Pass: <span className="text-slate-200 font-mono">adminpass</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
