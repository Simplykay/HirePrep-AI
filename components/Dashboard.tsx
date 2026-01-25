
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
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

interface DashboardProps {
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  onRequestAccess: (tier: SubscriptionTier, featureName: string) => boolean;
  checkAccess: (tier: SubscriptionTier) => boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onRequestAccess, checkAccess }) => {
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

  const handleCvUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        // Simulating text extraction
        const simulatedText = `${user.name} - Updated Professional CV. Extracted from ${file.name}. Skills: Leadership, Strategy, Technical Architecture.`;
        onUpdateUser({
          cvData: simulatedText,
          cvLastUpdated: new Date().toISOString()
        });
        setIsUploading(false);
      }, 2000);
    }
  };

  const saveLinkedin = () => {
    // LinkedIn feature requires Monthly plan
    if (onRequestAccess('Monthly', 'LinkedIn Profile Sync')) {
       if (linkedinEdit) {
         onUpdateUser({ linkedInUrl: linkedinEdit });
       }
    }
  };

  const hasInsightsAccess = checkAccess('Weekly');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Professional Hero Section */}
      <div id="welcome-hero" className="bg-emerald-600 rounded-3xl p-6 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 pattern-overlay"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Welcome back, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-emerald-100 text-sm md:text-lg mb-8 opacity-90">
              {user.history.length > 0
                ? `Last performance: ${lastSession.score}%. Keep that momentum for your ${lastSession.role} target!`
                : "Your global career journey starts here. Launch your first mock interview."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full mt-6">
              <Tooltip text="Begin a fresh analysis & mock session">
                <button
                  id="start-prep-btn"
                  onClick={startFreshSession}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-xl active:scale-95"
                >
                  <i className="fas fa-plus-circle text-sm"></i>
                  <span>Start New Prep</span>
                </button>
              </Tooltip>
              {user.lastSessionState && (
                <button
                  onClick={resumePrep}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-800 transition-all border border-emerald-500/30 active:scale-95"
                >
                  <i className="fas fa-redo text-sm"></i>
                  <span>Resume Studio</span>
                </button>
              )}
            </div>
          </div>

          <div id="competency-index" className="w-full lg:w-auto flex-shrink-0 bg-emerald-700/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 min-w-[240px] mt-6 lg:mt-0">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CV Management Card */}
        <div className="bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-800/50 flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
             <i className="fas fa-file-contract text-8xl text-white"></i>
           </div>
           
           <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-100">Professional Profile</h2>
                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${user.cvData ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                  {user.cvData ? 'Active' : 'Missing'}
                </span>
              </div>
              
              <div className="space-y-6 mb-6">
                 {user.cvData ? (
                   <div className="flex items-start space-x-3">
                     <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                       <i className="fas fa-check"></i>
                     </div>
                     <div>
                       <p className="text-xs font-bold text-slate-200">CV Saved on File</p>
                       <p className="text-[10px] text-slate-500 mt-1">Last updated: {user.cvLastUpdated ? new Date(user.cvLastUpdated).toLocaleDateString() : 'Just now'}</p>
                     </div>
                   </div>
                 ) : (
                   <p className="text-xs text-slate-400 leading-relaxed">Upload your CV once to auto-fill future interview preparations. We store it securely.</p>
                 )}

                 {/* LinkedIn Field */}
                 <div className="space-y-2 relative">
                   <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center">
                     <i className="fab fa-linkedin mr-1.5 text-blue-500"></i> LinkedIn Profile
                   </label>
                   <div className="flex space-x-2 relative z-10">
                     <input 
                        type="text" 
                        placeholder="https://linkedin.com/in/..." 
                        className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50"
                        value={linkedinEdit}
                        onChange={(e) => setLinkedinEdit(e.target.value)}
                        onBlur={saveLinkedin}
                        onClick={() => onRequestAccess('Monthly', 'LinkedIn Profile Sync')}
                     />
                     <button onClick={saveLinkedin} className="w-8 h-8 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors text-white">
                        <i className="fas fa-save text-[10px]"></i>
                     </button>
                   </div>
                   
                   {!checkAccess('Monthly') && (
                      <div className="absolute -right-2 -top-2">
                         <i className="fas fa-lock text-amber-500 text-[10px]"></i>
                      </div>
                   )}
                 </div>
              </div>
           </div>

           <label className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-center cursor-pointer transition-all border border-dashed flex items-center justify-center space-x-2 ${
              isUploading 
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-500 hover:text-white hover:bg-slate-900'
           }`}>
              <input type="file" className="hidden" onChange={handleCvUpdate} disabled={isUploading} accept=".pdf,.doc,.docx" />
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <i className={`fas ${user.cvData ? 'fa-sync-alt' : 'fa-upload'}`}></i>
                  <span>{user.cvData ? 'Update CV' : 'Upload CV'}</span>
                </>
              )}
           </label>
        </div>

        {/* Progress Section */}
        <div id="performance-trend" className="lg:col-span-2 bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-800/50">
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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                  <ChartTooltip
                    contentStyle={{ borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: '#020617', color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-800/50 flex flex-col lg:col-span-1">
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

        {/* Market Recommendations - Restricted Section */}
        <div className="lg:col-span-2 bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-800/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold text-slate-100">AI Career Insights</h2>
               {!hasInsightsAccess && <i className="fas fa-lock text-amber-500"></i>}
            </div>

            {hasInsightsAccess ? (
               user.history.length > 0 ? (
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
               ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50 min-h-[160px]">
                    <i className="fas fa-lightbulb text-4xl text-slate-700 mb-4"></i>
                    <p className="text-sm text-slate-500">Complete your first interview to generate personalized AI insights.</p>
                </div>
               )
            ) : (
              // Locked State
              <div className="relative">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-20 filter blur-sm select-none pointer-events-none">
                     <div className="p-6 bg-slate-800 rounded-2xl h-40"></div>
                     <div className="p-6 bg-slate-800 rounded-2xl h-40"></div>
                     <div className="p-6 bg-slate-800 rounded-2xl h-40"></div>
                 </div>
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 shadow-xl mb-4">
                       <i className="fas fa-lock text-amber-500 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Detailed Market Analysis Locked</h3>
                    <p className="text-xs text-slate-400 mb-4 max-w-sm">Upgrade to Weekly Sprint or higher to unlock personalized AI feedback, market salary trends, and skill gap analysis.</p>
                    <button 
                      onClick={() => onRequestAccess('Weekly', 'AI Career Insights')}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
                    >
                      Unlock Insights
                    </button>
                 </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
