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
    // Don't show celebration during interviews
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
            <img src={`https://i.pravatar.cc/150?u=${user.name}`} alt="Recruiter" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
            <i className="fas fa-check text-[8px] text-white"></i>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Success Mentor</p>
          <p className="text-sm text-slate-200">"You look sharp today, {user.name.split(' ')[0]}! Ready to secure that offer?"</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
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

  // Hide the assistant during active interviews to maximize screen space on mobile
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
                <i className="fas fa-robot"></i>
              </div>
              <span className="font-bold text-sm">Career Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                 <div className="bg-slate-800 p-3 rounded-2xl flex space-x-1">
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
              className="flex-grow bg-slate-800 border-none rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" 
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-paper-plane text-[10px]"></i>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all success-glow"
        >
          <i className="fas fa-comment-dots text-lg md:text-xl"></i>
        </button>
      )}
    </div>
  );
};

const AppRoutes: React.FC<{ user: UserProfile, onLogout: () => void, updateUserInfo: (u: Partial<UserProfile>) => void, addInterviewResult: (r: InterviewResult) => void, handleUpgrade: (t: SubscriptionTier) => void }> = ({ user, onLogout, updateUserInfo, addInterviewResult, handleUpgrade }) => {
  return (
    <>
      <Header user={user} onLogout={onLogout} />
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
    </>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Persistence simulation
  useEffect(() => {
    const savedUser = localStorage.getItem('hireprep_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Ensure history exists for older saved profiles
      if (!parsed.history) parsed.history = [];
      setUser(parsed);
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
    const newHistory = [result, ...user.history].slice(0, 10); // Keep last 10
    updateUserInfo({
      history: newHistory,
      interviewsCompleted: user.interviewsCompleted + 1
    });
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <AppRoutes 
          user={user} 
          onLogout={handleLogout} 
          updateUserInfo={updateUserInfo} 
          addInterviewResult={addInterviewResult} 
          handleUpgrade={handleUpgrade} 
        />
        
        <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} HirePrep AI. Helping Africa's talent reach the global stage.
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;