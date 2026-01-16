
import React, { useState } from 'react';
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

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: 'fa-home' },
    { path: '/prepare', label: 'Preparation', icon: 'fa-rocket' },
    { path: '/pricing', label: 'Plans', icon: 'fa-shield-halved' },
  ];

  return (
    <header className="bg-slate-950/80 border-b border-slate-800/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center group">
          <Logo className="h-8" />
        </Link>

        <nav className="hidden md:flex items-center bg-slate-900/50 px-2 py-1 rounded-full border border-slate-800">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                location.pathname === link.path 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-2">
                <i className={`fas ${link.icon} text-[10px]`}></i>
                <span>{link.label}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-slate-100 leading-none mb-1">{user.name}</p>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
              {user.isPremium ? (
                <span className="text-amber-500">Premium Access</span>
              ) : (
                'Standard Tier'
              )}
            </p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 transition-all overflow-hidden focus:outline-none"
            >
              <img src={user.avatarUrl || `https://picsum.photos/seed/${user.name}/100/100`} alt="Avatar" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-12 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-slide-up">
                <div className="px-5 py-3 border-b border-slate-800">
                  <p className="text-xs font-bold text-slate-100">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center space-x-3"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
