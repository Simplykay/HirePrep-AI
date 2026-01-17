
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import Logo from './Logo';

interface HeaderProps {
  user: UserProfile;
  onLogout: () => void;
  onRestartTour?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onRestartTour }) => {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: 'fa-chart-pie' },
    { path: '/prepare', label: 'Preparation', icon: 'fa-graduation-cap' },
    { path: '/pricing', label: 'Pricing', icon: 'fa-credit-card' },
    { path: '/history', label: 'History', icon: 'fa-clock-rotate-left' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-950/80 border-b border-slate-800/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-12">
          <Link to="/" className="flex items-center group">
            <Logo className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center space-x-3 relative group ${
                    isActive 
                    ? 'text-emerald-400' 
                    : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {/* Active Background Pill */}
                  {isActive && (
                    <div className="absolute inset-0 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-fade-in"></div>
                  )}
                  
                  {/* Active Underline Indicator */}
                  {isActive && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-500 rounded-full animate-slide-up"></div>
                  )}

                  <i className={`fas ${link.icon} text-[13px] relative z-10 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`}></i>
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Menu & Desktop Actions */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-xs font-black text-slate-100 leading-none mb-1.5">{user.name}</p>
            <div className="flex items-center space-x-2">
              <span className={`w-1.5 h-1.5 rounded-full ${user.isPremium ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                {user.subscriptionTier} Member
              </p>
            </div>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="group relative w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all overflow-hidden focus:outline-none flex items-center justify-center p-0.5 shadow-lg"
            >
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`} 
                className="w-full h-full rounded-[14px] object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" 
                alt="Profile" 
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-[14px]"></div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-14 w-64 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl py-3 z-[60] animate-slide-up ring-4 ring-black/20 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-800/50 bg-slate-950/30">
                  <p className="text-sm font-black text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold truncate mt-1">{user.email}</p>
                </div>
                
                <div className="p-2">
                  <Link 
                    to="/" 
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    <i className="fas fa-columns text-slate-500 w-5 text-center"></i>
                    <span>Overview</span>
                  </Link>
                  <button 
                    onClick={() => { setShowDropdown(false); onRestartTour?.(); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    <i className="fas fa-route text-blue-500 w-5 text-center"></i>
                    <span>Restart Tour</span>
                  </button>
                  <Link 
                    to="/pricing" 
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    <i className="fas fa-crown text-amber-500 w-5 text-center"></i>
                    <span>Subscription</span>
                  </Link>
                  <div className="h-px bg-slate-800 my-2 mx-4"></div>
                  <button 
                    onClick={() => { setShowDropdown(false); onLogout(); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <i className="fas fa-sign-out-alt w-5 text-center"></i>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-2xl transition-all shadow-md"
          >
            <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars-staggered'} text-lg`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 animate-in slide-in-from-top-4 fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto">
          <div className="p-6 space-y-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2 mb-2">Navigation</p>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  onClick={() => setShowMobileMenu(false)}
                  to={link.path}
                  className={`flex items-center space-x-5 p-5 rounded-3xl font-black text-sm transition-all border ${
                    isActive 
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 border-emerald-500' 
                    : 'text-slate-400 bg-slate-900/30 border-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <i className={`fas ${link.icon} w-6 text-center text-lg ${isActive ? 'text-white' : 'text-slate-500'}`}></i>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            <div className="pt-8 mt-8 border-t border-slate-800 space-y-6">
               <div className="flex items-center space-x-5 px-4">
                  <img 
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`} 
                    className="w-14 h-14 rounded-2xl shadow-lg" 
                    alt="User" 
                  />
                  <div>
                    <p className="font-black text-white text-base leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{user.subscriptionTier} Account</p>
                  </div>
               </div>
               <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-4 p-5 rounded-3xl font-black text-sm text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all"
               >
                 <i className="fas fa-sign-out-alt w-6 text-center text-lg"></i>
                 <span>Sign Out</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
