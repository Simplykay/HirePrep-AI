
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SubscriptionTier } from '../types';
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
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const GOOGLE_CLIENT_ID = '145958773997-n464ubtsg3hqeqrv2p4q60gfe6a21tt7.apps.googleusercontent.com';

  // Initialize Google Sign-In button
  useEffect(() => {
    const initializeGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google && googleButtonRef.current) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
          });

          // Render the Google Sign-In button
          (window as any).google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme: 'filled_blue',
              size: 'large',
              width: googleButtonRef.current.offsetWidth,
              text: 'continue_with',
              shape: 'rectangular',
            }
          );
        } catch (err) {
          console.error('Google initialization error:', err);
        }
      } else {
        // Retry if Google hasn't loaded yet
        setTimeout(initializeGoogle, 300);
      }
    };

    // Small delay to ensure the ref is attached
    setTimeout(initializeGoogle, 100);
  }, []);

  const handleGoogleCallback = (response: any) => {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));

      onLogin({
        name: payload.name || 'Google User',
        email: payload.email,
        isPremium: false,
        subscriptionTier: 'Free',
        interviewsCompleted: 0,
        history: [],
        avatarUrl: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name)}&background=random&color=fff`
      });
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to process Google login. Please try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const storedUsersRaw = localStorage.getItem('hireprep_registered_users');
    const users = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

    if (isLogin) {
      // Check for demo admin account
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
        }, 800);
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
        }, 800);
      } else {
        setTimeout(() => {
          setError('Invalid email or password. Please try again.');
          setLoading(false);
        }, 800);
      }
    } else {
      if (users.some((u: any) => u.email === email)) {
        setError('Email already registered. Please sign in.');
        setLoading(false);
        return;
      }

      const newUser = {
        name,
        email,
        password,
        isPremium: false,
        subscriptionTier: 'Free' as SubscriptionTier,
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
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
        <div className="absolute inset-0 pattern-overlay opacity-5"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in">
            <Logo className="h-12 mx-auto mb-4" variant="light" />
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              Welcome {isLogin ? 'Back' : 'to HirePrep'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Sign in to continue your journey' : 'Start your path to career success'}
            </p>
          </div>

          {/* Auth Card */}
          <div className="glass border border-slate-800/50 rounded-3xl p-8 shadow-2xl animate-slide-up">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 animate-fade-in">
                <i className="fas fa-exclamation-circle text-red-400 mt-0.5"></i>
                <p className="text-red-400 text-sm flex-1">{error}</p>
              </div>
            )}

            {/* Google Sign-In Button Container */}
            <div className="mb-6">
              <div
                ref={googleButtonRef}
                className="w-full flex justify-center"
                style={{ minHeight: '44px' }}
              ></div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-4 text-slate-500 font-bold uppercase tracking-widest">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Processing...</span>
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Toggle Sign In/Sign Up */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
              >
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span className="text-emerald-400 font-bold underline">
                  {isLogin ? 'Sign up' : 'Sign in'}
                </span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-500">
            <p>© 2026 HirePrep AI. Empowering African Talent Globally.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
