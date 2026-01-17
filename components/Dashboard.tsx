
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserProfile, InterviewResult } from '../types';
import { CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

// Simple hover tooltip component
const Tooltip: React.FC<{ children: React.ReactNode, text: string }> = ({ children, text }) => {
  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const navigate = useNavigate();
  
  const historyData = [...user.history].reverse().map((h, i) => ({
    name: `Sess ${i + 1}`,
    score: h.score,
    date: new Date(h.date).toLocaleDateString()
  }));

  const lastSession = user.history[0];

  const resumePrep = () => {
    if (user.lastSessionState) {
      sessionStorage.setItem('current_interview', JSON.stringify(user.lastSessionState));
      navigate('/interview');
    }
  };

  const startFreshSession = () => {
    sessionStorage.removeItem('current_interview');
    localStorage.removeItem('active_interview_transcript');
    navigate('/prepare');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Professional Hero Section */}
      <div id="welcome-hero" className="bg-emerald-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 pattern-overlay"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              Welcome back, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-emerald-100 text-lg mb-8 opacity-90">
              {user.history.length > 0 
                ? `Last performance: ${lastSession.score}%. Keep that momentum for your ${lastSession.role} target!`
                : "Your global career journey starts here. Launch your first mock interview."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Tooltip text="Begin a fresh analysis & mock session">
                <button 
                  id="start-prep-btn"
                  onClick={startFreshSession}
                  className="inline-flex items-center justify-center space-x-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-xl active:scale-95 w-full sm:w-auto"
                >
                  <i className="fas fa-plus-circle text-sm"></i>
                  <span>Start New Prep</span>
                </button>
              </Tooltip>
              {user.lastSessionState && (
                <button 
                  onClick={resumePrep}
                  className="inline-flex items-center justify-center space-x-2 bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-800 transition-all border border-emerald-500/30 active:scale-95 w-full sm:w-auto"
                >
                  <i className="fas fa-redo text-sm"></i>
                  <span>Resume Studio</span>
                </button>
              )}
            </div>
          </div>
          
          <div id="competency-index" className="flex-shrink-0 bg-emerald-700/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 min-w-[240px]">
             <div className="text-center mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Competency Index</p>
                <p className="text-5xl font-black text-white">
                  {user.history.length > 0 
                    ? Math.round(user.history.reduce((acc, h) => acc + h.score, 0) / user.history.length)
                    : 0
                  }<span className="text-xl">%</span>
                </p>
             </div>
             <div className="flex gap-4">
                <div className="text-center px-4 border-r border-white/10 flex-1">
                   <p className="text-[9px] font-bold text-emerald-200 uppercase">Sessions</p>
                   <p className="text-xl font-bold">{user.interviewsCompleted}</p>
                </div>
                <div className="text-center px-4 flex-1">
                   <p className="text-[9px] font-bold text-emerald-200 uppercase">Market Tier</p>
                   <p className="text-lg font-bold">Global</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div id="performance-trend" className="lg:col-span-2 bg-slate-900/50 p-8 rounded-2xl border border-slate-800/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Performance Trend</h2>
              <p className="text-xs text-slate-500 mt-1">Growth across your sessions.</p>
            </div>
            <Tooltip text="Scores derived from Gemini AI analysis">
               <i className="fas fa-info-circle text-slate-600 cursor-help"></i>
            </Tooltip>
          </div>
          
          <div className="h-72">
            {user.history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={[0, 100]} />
                  <ChartTooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: '#020617', color: '#fff'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{fill: '#10b981', r: 5}} 
                    activeDot={{r: 8, stroke: '#fff', strokeWidth: 2}}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <i className="fas fa-chart-line text-4xl text-slate-700"></i>
                <p className="text-sm text-slate-500">History will appear here after your first prep.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800/50 flex flex-col">
          <h2 className="text-xl font-bold mb-6 text-slate-100">Recent Sessions</h2>
          <div className="space-y-4 flex-grow overflow-y-auto max-h-[300px] pr-2">
            {user.history.length > 0 ? (
              user.history.map((h) => (
                <div key={h.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-xs text-slate-200 line-clamp-1">{h.role}</p>
                    <span className="text-[10px] font-black text-emerald-500 ml-2">{h.score}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-500">{new Date(h.date).toLocaleDateString()}</p>
                    <button onClick={() => navigate('/prepare')} className="text-[9px] text-emerald-400 font-bold hover:underline">Re-prep</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 opacity-40">
                <p className="text-xs italic">No transcripts logged yet.</p>
              </div>
            )}
          </div>
          <button 
            onClick={startFreshSession}
            className="w-full mt-6 py-4 bg-slate-800 text-white text-center text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-colors shadow-lg active:scale-95"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Market Recommendations */}
      {user.history.length > 0 && (
        <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800/50">
          <h2 className="text-xl font-bold mb-6 text-slate-100">AI Career Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <h4 className="font-bold text-sm mb-2 text-blue-100 uppercase tracking-widest text-[10px]">Technical Mastery</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Your architectural explanations are strong. Keep focusing on scalability when answering system design questions.</p>
            </div>
            <div className="p-6 bg-purple-900/10 border border-purple-500/20 rounded-2xl">
              <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-comments"></i>
              </div>
              <h4 className="font-bold text-sm mb-2 text-purple-100 uppercase tracking-widest text-[10px]">Behavioral Depth</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">The STAR method is working well. Remember to explicitly state the quantifiable result in your final step.</p>
            </div>
            <div className="p-6 bg-amber-900/10 border border-amber-500/20 rounded-2xl">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-globe"></i>
              </div>
              <h4 className="font-bold text-sm mb-2 text-amber-100 uppercase tracking-widest text-[10px]">Global Fit</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Continue highlighting your cross-border collaboration experience as global companies value cultural adaptability.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
