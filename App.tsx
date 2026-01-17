
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PreparationFlow from './components/PreparationFlow';
import InterviewRoom from './components/InterviewRoom';
import Pricing from './components/Pricing';
import Auth from './components/Auth';
import { UserProfile, SubscriptionTier, InterviewResult } from './types';
import { createChatSession } from './services/geminiService';

// Floating Corner Component for Onboarding/Celebration
const CornerCelebration: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/interview') {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 1500);
    const hideTimer = setTimeout(() => setVisible(false), 8000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-slide-in-right hidden md:block">
      <div className="glass border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-center space-x-4 max-w-xs success-glow">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 animate-float">
            <img src={`https://i.pravatar.cc/150?u=${encodeURIComponent(user.name)}`} alt="Recruiter" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
            <i className="fas fa-check text-[8px] text-white"></i>
          </div>
        </div>
        <div className="flex-grow">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Success Mentor</p>
          <p className="text-sm text-slate-200">"Looking sharp, {user.name.split(' ')[0]}! Ready to secure that offer?"</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-slate-600 hover:text-slate-400 transition-colors ml-2">
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>
    </div>
  );
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

  // Persistence simulation with error handling
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
  };

  const addInterviewResult = (result: InterviewResult) => {
    if (!user) return;
    const newHistory = [result, ...user.history].slice(0, 10);
    updateUserInfo({
      history: newHistory,
      interviewsCompleted: user.interviewsCompleted + 1
    });
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
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {!user ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <>
            <Header user={user} onLogout={handleLogout} />
            <main className="flex-grow container mx-auto px-4 py-4 md:py-8 max-w-6xl">
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/history" element={<Dashboard user={user} />} />
                <Route path="/prepare" element={<PreparationFlow user={user} onSaveState={(s) => updateUserInfo({ lastSessionState: s })} />} />
                <Route path="/interview" element={<InterviewRoom user={user} onFinish={addInterviewResult} />} />
                <Route path="/pricing" element={<Pricing user={user} onUpgrade={handleUpgrade} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <CornerCelebration user={user} />
            <AIChatAssistant />
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
