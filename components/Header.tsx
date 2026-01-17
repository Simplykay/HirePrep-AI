
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import Logo from './Logo';

interface HeaderProps {
  user: UserProfile;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: 'fa-chart-pie' },
    { path: '/prepare', label: 'Preparation', icon: 'fa-graduation-cap' },
    { path: '/pricing', label: 'Pricing', icon: 'fa-credit-card' },
    { path: '/history', label: 'Interview History', icon: 'fa-clock-rotate-left' },
  ];

  // Close dropdown when clicking outside
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
      <div className="container mx-auto px-6 h-18 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center group">
            <Logo className="h-9" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 ${
                    isActive 
                    ? 'bg-emerald-600/10 text-emerald-400' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <i className={`fas ${link.icon} text-[11px] ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-xs font-black text-slate-100 leading-none mb-1">{user.name}</p>
            <div className="flex items-center space-x-2">
              <span className={`w-1.5 h-1.5 rounded-full ${user.isPremium ? 'bg-amber-500' : 'bg-slate-600'}`}></span>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                {user.subscriptionTier} Account
              </p>
            </div>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 transition-all overflow-hidden focus:outline-none flex items-center justify-center p-0.5"
            >
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`} 
                className="w-full h-full rounded-[14px] object-cover" 
                alt="Profile" 
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-14 w-64 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl py-3 z-[60] animate-slide-up ring-4 ring-black/20">
                <div className="px-6 py-4 border-b border-slate-800/50">
                  <p className="text-sm font-black text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{user.email}</p>
                </div>
                
                <div className="p-2">
                  <Link 
                    to="/" 
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    <i className="fas fa-user-circle text-slate-500"></i>
                    <span>View Profile</span>
                  </Link>
                  <Link 
                    to="/pricing" 
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    <i className="fas fa-crown text-amber-500"></i>
                    <span>Manage Subscription</span>
                  </Link>
                  <div className="h-px bg-slate-800 my-2 mx-4"></div>
                  <button 
                    onClick={() => { setShowDropdown(false); onLogout(); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-2xl transition-all"
          >
            <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 animate-in slide-in-from-top-4 fixed inset-x-0 top-18 bottom-0 z-40">
          <div className="p-6 space-y-3">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2 mb-2">Navigation</p>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                onClick={() => setShowMobileMenu(false)}
                to={link.path}
                className={`flex items-center space-x-4 p-5 rounded-[2rem] font-black text-sm transition-all ${
                  location.pathname === link.path 
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' 
                  : 'text-slate-400 bg-slate-900/30 border border-slate-800/50'
                }`}
              >
                <i className={`fas ${link.icon} w-6 text-center`}></i>
                <span>{link.label}</span>
              </Link>
            ))}
            
            <div className="pt-6 mt-6 border-t border-slate-800 space-y-4">
               <div className="flex items-center space-x-4 px-4">
                  <img 
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`} 
                    className="w-12 h-12 rounded-2xl" 
                    alt="User" 
                  />
                  <div>
                    <p className="font-black text-white text-sm">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.subscriptionTier} Tier</p>
                  </div>
               </div>
               <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-4 p-5 rounded-[2rem] font-black text-sm text-red-400 bg-red-500/5 border border-red-500/10"
               >
                 <i className="fas fa-sign-out-alt w-6 text-center"></i>
                 <span>Logout from HirePrep</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
