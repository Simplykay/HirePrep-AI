
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PreparationFlow from './components/PreparationFlow';
import InterviewRoom from './components/InterviewRoom';
import Pricing from './components/Pricing';
import Auth from './components/Auth';
import UpgradeModal from './components/UpgradeModal';
import { UserProfile, SubscriptionTier, InterviewResult } from './types';
import { createChatSession } from './services/geminiService';

// ScrollToTop Component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Global Chatbot UI
const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
      setMessages([{ role: 'model', text: 'Hi! I am your HirePrep Assistant. How can I help with your career today?' }]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (location.pathname === '/interview') return null;

  const handleSend = async () => {
    if (!input.trim() || loading || !chatSessionRef.current) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[70]">
      {isOpen ? (
        <div className="w-80 h-96 glass border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-robot text-xs"></i>
              </div>
              <span className="font-bold text-xs">Career Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                 <div className="bg-slate-800 p-3 rounded-2xl flex space-x-1 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                 </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          <div className="p-3 bg-slate-900/50 border-t border-slate-800 flex space-x-2">
            <input 
              type="text" 
              className="flex-grow bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-[11px] focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-600 text-white" 
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow-lg active:scale-90">
              <i className="fas fa-paper-plane text-[10px]"></i>
            </button>
          </div>
        </div>
      ) : (
        <button 
          id="career-assistant-btn"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all success-glow group"
        >
          <i className="fas fa-comment-dots text-xl group-hover:rotate-12 transition-transform"></i>
        </button>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('');
  const [requiredTier, setRequiredTier] = useState('');

  // Persistence simulation
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('hireprep_user');
      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.history) parsed.history = [];
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to restore user session:", e);
      localStorage.removeItem('hireprep_user');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleLogin = (newUser: UserProfile) => {
    if (!newUser.history) newUser.history = [];
    setUser(newUser);
    localStorage.setItem('hireprep_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hireprep_user');
    window.location.hash = '/';
  };

  const updateUserInfo = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('hireprep_user', JSON.stringify(updated));
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    updateUserInfo({ isPremium: tier !== 'Free', subscriptionTier: tier });
    setUpgradeModalOpen(false); // Close modal on successful upgrade
  };

  const addInterviewResult = (result: InterviewResult) => {
    if (!user) return;
    const newHistory = [result, ...user.history].slice(0, 10);
    updateUserInfo({
      history: newHistory,
      interviewsCompleted: user.interviewsCompleted + 1
    });
  };

  // Centralized Access Control Logic
  const checkFeatureAccess = (tier: SubscriptionTier | 'Admin'): boolean => {
    if (!user) return false;
    // Default Admin Bypass
    if (user.email === 'admin@gmail.com') return true;

    const tiers = ['Free', 'Weekly', 'Monthly', 'Yearly'];
    const userTierIndex = tiers.indexOf(user.subscriptionTier);
    const requiredTierIndex = tiers.indexOf(tier === 'Admin' ? 'Yearly' : tier); // Admin is practically unlimited

    return userTierIndex >= requiredTierIndex;
  };

  const requestFeatureAccess = (tier: SubscriptionTier, featureName: string): boolean => {
    if (checkFeatureAccess(tier)) {
      return true;
    }
    setUpgradeFeatureName(featureName);
    setRequiredTier(tier);
    setUpgradeModalOpen(true);
    return false;
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {!user ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <>
            <Header user={user} onLogout={handleLogout} />
            <main className="flex-grow container mx-auto px-4 py-4 md:py-8 max-w-6xl">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <Dashboard 
                      user={user} 
                      onUpdateUser={updateUserInfo} 
                      onRequestAccess={requestFeatureAccess}
                      checkAccess={checkFeatureAccess}
                    />
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <Dashboard 
                      user={user} 
                      onUpdateUser={updateUserInfo}
                      onRequestAccess={requestFeatureAccess}
                      checkAccess={checkFeatureAccess} 
                    />
                  } 
                />
                <Route 
                  path="/prepare" 
                  element={
                    <PreparationFlow 
                      user={user} 
                      onSaveState={(s) => updateUserInfo({ lastSessionState: s })} 
                      onUpdateUser={updateUserInfo} 
                      onRequestAccess={requestFeatureAccess}
                    />
                  } 
                />
                <Route path="/interview" element={<InterviewRoom user={user} onFinish={addInterviewResult} />} />
                <Route path="/pricing" element={<Pricing user={user} onUpgrade={handleUpgrade} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <AIChatAssistant />
            <UpgradeModal 
              isOpen={upgradeModalOpen} 
              onClose={() => setUpgradeModalOpen(false)} 
              featureName={upgradeFeatureName}
              requiredTier={requiredTier}
            />
            <footer className="bg-slate-900 border-t border-slate-800 py-8 mt-auto">
              <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest gap-4">
                <p>&copy; {new Date().getFullYear()} HirePrep AI. Empowering African Talent.</p>
                <div className="flex items-center space-x-6">
                   <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
                   <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
                   <a href="#" className="hover:text-emerald-400 transition-colors">Support</a>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
