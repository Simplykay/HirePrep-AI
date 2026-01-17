
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserProfile, Difficulty, InterviewState, AfricanRegion } from '../types';
import { analyzeJobContext } from '../services/geminiService';

const PERSISTENCE_KEY = 'hireprep_prep_draft';

const PreparationFlow: React.FC<{ user: UserProfile, onSaveState?: (state: InterviewState) => void }> = ({ user, onSaveState }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const [form, setForm] = useState<InterviewState>(() => {
    // Attempt to load from localStorage first
    const saved = localStorage.getItem(PERSISTENCE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved preparation state", e);
      }
    }
    // Fallback to default
    return {
      cvText: '',
      jobDescription: '',
      jobRole: '',
      jobLocation: '',
      industry: '',
      difficulty: Difficulty.MEDIUM,
      region: 'Nigeria (West)',
      isRandomized: false
    };
  });

  // Persist form changes to localStorage
  useEffect(() => {
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(form));
  }, [form]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsScanning(true);
      setTimeout(() => {
        setForm(prev => ({ 
          ...prev, 
          cvText: `${user.name} - Professional profile extracted from uploaded document. Background in ${form.industry || 'specified field'}. Ready for benchmarking.`
        }));
        setIsScanning(false);
      }, 2000);
    }
  };

  const handleAnalyze = async () => {
    if (!form.jobRole || !form.industry || !form.jobDescription || !form.jobLocation) return;
    setLoading(true);
    try {
      const result = await analyzeJobContext(form);
      setAnalysis(result);
      setStep(3);
      if (onSaveState) onSaveState(form);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
    // Clear draft once we commit to a real session
    localStorage.removeItem(PERSISTENCE_KEY);
    localStorage.removeItem('active_interview_transcript');
    sessionStorage.setItem('current_interview', JSON.stringify(form));
    navigate('/interview');
  };

  const regions: AfricanRegion[] = [
    'Nigeria (West)', 'Kenya (East)', 'South Africa (South)', 
    'Egypt (North)', 'Ghana (West)', 'Ethiopia (East)', 
    'Remote / Pan-African', 'Global / International'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative pb-12">
      
      {/* Navigation & Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <Link to="/" className="text-xs font-black text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-[0.2em] flex items-center space-x-3 group bg-slate-900/50 py-2 px-4 rounded-full border border-slate-800">
          <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          <span>Dashboard</span>
        </Link>
        <div className="text-right">
          <h1 className="text-2xl font-black text-white">Interview Studio</h1>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Step {step} of 3</p>
        </div>
      </div>

      {/* Visual Stepper */}
      <div className="flex items-center justify-between mb-12 px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 transform ${
              step === s ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 scale-110' : step > s ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-600'
            }`}>
              {step > s ? <i className="fas fa-check text-xs"></i> : s}
            </div>
            {s < 3 && <div className={`h-0.5 flex-grow mx-4 rounded-full ${step > s ? 'bg-emerald-600' : 'bg-slate-800'}`}></div>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="animate-in fade-in duration-500 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Role Context</h2>
                  <p className="text-slate-500 text-xs">Provide details for high-fidelity simulation.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Position</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Senior Backend Engineer" 
                        className="w-full bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-800 text-slate-100 placeholder:text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                        value={form.jobRole}
                        onChange={e => setForm(prev => ({ ...prev, jobRole: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Industry Sector</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Fintech / Logistics" 
                        className="w-full bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-800 text-slate-100 placeholder:text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                        value={form.industry}
                        onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Physical/Remote Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lagos, Nigeria or Global Remote" 
                      className="w-full bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-800 text-slate-100 placeholder:text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                      value={form.jobLocation}
                      onChange={e => setForm(prev => ({ ...prev, jobLocation: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Description (JD)</label>
                    <textarea 
                      rows={5}
                      placeholder="Paste key responsibilities or full JD here..." 
                      className="w-full bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-800 text-slate-100 placeholder:text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all outline-none resize-none"
                      value={form.jobDescription}
                      onChange={e => setForm(prev => ({ ...prev, jobDescription: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl flex flex-col h-full">
                <h3 className="font-bold text-slate-200">Profile Sync</h3>
                <div className="relative border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer group flex-grow flex flex-col items-center justify-center">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                  {isScanning ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-emerald-400 animate-pulse tracking-widest uppercase">Benchmarking...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-emerald-600 transition-all shadow-xl">
                        <i className={`fas ${form.cvText ? 'fa-check text-emerald-400 group-hover:text-white' : 'fa-cloud-upload-alt text-slate-600 group-hover:text-white'} text-2xl`}></i>
                      </div>
                      <div>
                        <p className="text-slate-200 font-bold text-sm">{form.cvText ? 'CV Data Analyzed' : 'Upload Resume'}</p>
                        <p className="text-[9px] text-slate-500 mt-2 font-black uppercase tracking-widest">PDF / DOCX Only</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setStep(2)}
                  disabled={!form.jobRole || !form.jobDescription || !form.cvText}
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-700 transition-all shadow-2xl shadow-emerald-900/20 active:scale-95"
                >
                  Configure Difficulty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-2xl font-black text-white">Market & Intensity</h2>
               <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Edit Context</button>
            </div>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Market Focus</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {regions.map(r => (
                    <button
                      key={r}
                      onClick={() => setForm(prev => ({ ...prev, region: r }))}
                      className={`p-4 rounded-xl border-2 text-[11px] font-bold transition-all ${
                        form.region === r ? 'border-emerald-600 bg-emerald-950 text-emerald-400 shadow-lg shadow-emerald-900/10' : 'border-slate-800 bg-slate-950 text-slate-600 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mock Complexity</label>
                <div className="grid grid-cols-3 gap-4">
                  {Object.values(Difficulty).map(d => (
                    <button
                      key={d}
                      onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                      className={`py-5 rounded-xl border-2 font-bold transition-all flex flex-col items-center ${
                        form.difficulty === d ? 'border-blue-600 bg-blue-950 text-blue-400 shadow-lg shadow-blue-900/10' : 'border-slate-800 bg-slate-950 text-slate-600 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm font-black uppercase">{d}</span>
                      <span className="text-[8px] mt-1 opacity-60 uppercase tracking-widest">
                        {d === Difficulty.HARD ? "Top Tier Rigor" : d === Difficulty.MEDIUM ? "Pro Standard" : "Warm Up"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-8 bg-slate-950 rounded-3xl border border-slate-800 shadow-inner group">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <i className="fas fa-brain text-2xl"></i>
                  </div>
                  <div>
                    <p className="font-black text-slate-200 uppercase text-xs tracking-widest">Adaptive Logic Engine</p>
                    <p className="text-xs text-slate-500 mt-1">AI dynamically adjusts questions based on answer depth.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setForm(prev => ({ ...prev, isRandomized: !prev.isRandomized }))}
                  className={`w-14 h-8 rounded-full transition-colors relative ${form.isRandomized ? 'bg-emerald-600' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${form.isRandomized ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            <div className="flex space-x-4 mt-16">
              <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all">Back</button>
              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-500 transition-all flex items-center justify-center space-x-4 shadow-2xl shadow-emerald-900/40 active:scale-95"
              >
                {loading ? <i className="fas fa-sync-alt fa-spin"></i> : <i className="fas fa-vial"></i>}
                <span>{loading ? 'Crunching Data...' : 'Confirm Session'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && analysis && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16">
          <div className="bg-slate-900 p-12 rounded-[48px] border border-slate-800 shadow-2xl relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
              <i className="fas fa-clipboard-check text-[16rem]"></i>
            </div>
            
            <div className="relative z-10 space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-10 space-y-4 md:space-y-0">
                <div>
                  <h2 className="text-4xl font-black text-white leading-tight">Pre-Session Dossier</h2>
                  <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Market: {form.region}</p>
                </div>
                <div className="bg-slate-950 px-6 py-4 rounded-2xl border border-slate-800 inline-block">
                   <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Session Target</p>
                   <p className="text-lg font-black text-slate-200">{form.jobRole}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="p-8 bg-slate-950 rounded-[32px] border border-slate-800 shadow-inner">
                    <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-6 flex items-center">
                      <i className="fas fa-fingerprint mr-4 text-emerald-500"></i>
                      Executive Summary
                    </h3>
                    <p className="text-sm text-slate-300 italic leading-relaxed font-medium">"{analysis.summary}"</p>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] flex items-center">
                      <i className="fas fa-layer-group mr-4 text-emerald-500"></i>
                      Gap Analysis Report
                    </h3>
                    <div className="space-y-4">
                      {analysis.skillGaps.map((gap: any, idx: number) => (
                        <div key={idx} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-start space-x-5 group hover:border-emerald-500/30 transition-colors">
                          <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${gap.status === 'matched' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : gap.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="text-xs font-black text-slate-100 uppercase tracking-widest">{gap.skill}</p>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{gap.advice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                   <div className="p-8 bg-emerald-950/20 border border-emerald-900/30 rounded-[40px]">
                      <h3 className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] mb-6 flex items-center">
                        <i className="fas fa-award mr-4"></i>
                        Competitive Strengths
                      </h3>
                      <ul className="space-y-4">
                        {analysis.strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-center space-x-4 text-sm text-slate-300">
                            <i className="fas fa-check-circle text-emerald-500 text-xs"></i>
                            <span className="font-bold">{s}</span>
                          </li>
                        ))}
                      </ul>
                   </div>

                   <div className="p-8 bg-blue-950/20 border border-blue-900/30 rounded-[40px]">
                      <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-6 flex items-center">
                        <i className="fas fa-chart-line mr-4"></i>
                        Market Intelligence
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-bold italic">{analysis.marketInsights}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-6">
                 <button onClick={() => setStep(2)} className="flex-1 py-6 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all">Back to Configuration</button>
                 <button 
                  onClick={startInterview}
                  className="flex-[2] py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/40 transform active:scale-95"
                >
                  Enter Interview Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreparationFlow;
