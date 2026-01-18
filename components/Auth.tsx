import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SubscriptionTier } from '../types';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

// Neural Network Background Animation Component
const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles: Particle[] = [];
    const properties = {
      bgColor: 'rgba(2, 6, 23, 1)',
      particleColor: 'rgba(16, 185, 129, 0.5)',
      particleRadius: 3,
      particleCount: 60,
      lineLength: 150,
      particleLife: 6,
    };

    class Particle {
      x: number;
      y: number;
      velocityX: number;
      velocityY: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.velocityX = (Math.random() - 0.5) * 0.5;
        this.velocityY = (Math.random() - 0.5) * 0.5;
      }

      position() {
        this.x + this.velocityX > w && this.velocityX > 0 || this.x + this.velocityX < 0 && this.velocityX < 0 ? this.velocityX *= -1 : this.velocityX;
        this.y + this.velocityY > h && this.velocityY > 0 || this.y + this.velocityY < 0 && this.velocityY < 0 ? this.velocityY *= -1 : this.velocityY;
        this.x += this.velocityX;
        this.y += this.velocityY;
      }

      reDraw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, properties.particleRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = properties.particleColor;
        ctx.fill();
      }
    }

    const reDrawBackground = () => {
      ctx.fillStyle = properties.bgColor;
      ctx.fillRect(0, 0, w, h);
    };

    const drawLines = () => {
      let x1, y1, x2, y2, length, opacity;
      for (let i = 0; i < particles.length; i++) {
        for (let j = 0; j < particles.length; j++) {
          x1 = particles[i].x;
          y1 = particles[i].y;
          x2 = particles[j].x;
          y2 = particles[j].y;
          length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          if (length < properties.lineLength) {
            opacity = 1 - length / properties.lineLength;
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    };

    const reDrawParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        particles[i].position();
        particles[i].reDraw();
      }
    };

    const loop = () => {
      reDrawBackground();
      reDrawParticles();
      drawLines();
      requestAnimationFrame(loop);
    };

    const init = () => {
      for (let i = 0; i < properties.particleCount; i++) {
        particles.push(new Particle());
      }
      loop();
    };

    init();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-60" />;
};

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Password Strength Logic
  useEffect(() => {
    if (isLogin) return;
    let strength = 0;
    if (password.length > 7) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
    if (password.length > 12) strength += 1;
    setPasswordStrength(strength);
  }, [password, isLogin]);

  const simulateGoogleLogin = () => {
    setLoading(true);
    // Simulate OAuth secure handshake
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
    }, 2000);
  };

  const validateForm = () => {
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    
    if (!isLogin) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return false;
      }
      if (!name.trim()) {
        setError('Full name is required.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    const storedUsersRaw = localStorage.getItem('hireprep_registered_users');
    const users = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

    // Simulate Network Latency for realism
    setTimeout(() => {
      if (isLogin) {
        // Admin Backdoor (Hidden from UI, kept for functionality)
        if (email === 'admin@gmail.com' && password === 'adminpass') {
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
          return;
        }

        const user = users.find((u: any) => u.email === email && u.password === password);
        if (user) {
          onLogin({
            ...user,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`
          });
        } else {
          setError('Invalid credentials. Access denied.');
        }
      } else {
        if (users.some((u: any) => u.email === email)) {
          setError('This email is already associated with an account.');
        } else {
          const newUser = {
            name,
            email,
            password, // In a real app, this would be hashed!
            isPremium: false,
            subscriptionTier: 'Free' as SubscriptionTier,
            interviewsCompleted: 0,
            history: []
          };
          users.push(newUser);
          localStorage.setItem('hireprep_registered_users', JSON.stringify(users));
          
          onLogin({
            ...newUser,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
          });
        }
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
      <NeuralBackground />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row shadow-[0_0_100px_rgba(16,185,129,0.1)] rounded-[3rem] overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Brand Side */}
        <div className="hidden lg:flex lg:w-5/12 bg-slate-900/80 backdrop-blur-xl p-12 flex-col justify-between border-r border-slate-800/50">
           <div>
             <Logo className="h-10 mb-12" variant="light" />
             <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-6">
               Secure Access to <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Global Career AI</span>
             </h1>
             <p className="text-slate-400 text-sm leading-relaxed">
               Join elite professionals utilizing neural voice analysis to dominate international interviews.
             </p>
           </div>
           
           <div className="space-y-6">
              <div className="flex items-center space-x-3 text-xs text-slate-500 font-bold uppercase tracking-widest">
                 <i className="fas fa-shield-alt text-emerald-500"></i>
                 <span>256-Bit SSL Encrypted</span>
              </div>
              <div className="flex -space-x-4">
                  {[1,2,3,4,5].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-900" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
                    +50k
                  </div>
              </div>
           </div>
        </div>

        {/* Auth Form Side */}
        <div className="w-full lg:w-7/12 bg-slate-950/80 backdrop-blur-2xl p-8 md:p-12 relative">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo className="h-10" variant="light" />
          </div>

          <div className="max-w-sm mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">{isLogin ? 'Welcome Back' : 'Create Secure ID'}</h2>
              <p className="text-slate-500 text-xs mt-2 font-medium">
                {isLogin ? 'Authenticate to access your dashboard.' : 'Initialize your professional profile.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 animate-pulse">
                <i className="fas fa-lock text-red-500 text-xs"></i>
                <span className="text-red-400 text-xs font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-2">Legal Name</label>
                  <div className="relative group">
                    <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors"></i>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-2">Work Email</label>
                <div className="relative group">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors"></i>
                  <input
                    type="email"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-2">Password</label>
                <div className="relative group">
                  <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-10 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white focus:outline-none"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                
                {!isLogin && password.length > 0 && (
                  <div className="flex items-center space-x-2 px-1 pt-1">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          passwordStrength <= 2 ? 'bg-red-500' : 
                          passwordStrength === 3 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} 
                        style={{width: `${(passwordStrength / 4) * 100}%`}}
                      ></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                      {passwordStrength <= 2 ? 'Weak' : passwordStrength === 3 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-emerald-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? <i className="fas fa-circle-notch fa-spin text-sm"></i> : <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'}`}></i>}
                <span>{loading ? 'Authenticating...' : isLogin ? 'Access Dashboard' : 'Initialize Account'}</span>
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-slate-900 px-2 text-slate-600 font-bold">Or authenticate via</span></div>
            </div>

            <button
              onClick={simulateGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all flex items-center justify-center space-x-3 shadow-lg active:scale-95 disabled:opacity-70"
            >
              <i className="fab fa-google text-sm"></i>
              <span>Google SSO</span>
            </button>

            <p className="text-center text-xs text-slate-500">
              {isLogin ? "New user?" : "Already verified?"}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors ml-1"
              >
                {isLogin ? 'Register secure ID' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;