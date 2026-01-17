
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Difficulty, InterviewState, AfricanRegion } from '../types';
import { analyzeJobContext } from '../services/geminiService';

const PreparationFlow: React.FC<{ user: UserProfile, onSaveState?: (state: InterviewState) => void }> = ({ user, onSaveState }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const [form, setForm] = useState<InterviewState>({
    cvText: '',
    jobDescription: '',
    jobRole: '',
    jobLocation: '',
    industry: '',
    difficulty: Difficulty.MEDIUM,
    region: 'Nigeria (West)',
    isRandomized: false
  });

  const regions: AfricanRegion[] = [
    'Nigeria (West)', 'Kenya (East)', 'South Africa (South)', 
    'Egypt (North)', 'Ghana (West)', 'Ethiopia (East)', 
    'Remote / Pan-African', 'Global / International'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsScanning(true);
      setTimeout(() => {
        setForm(prev => ({ 
          ...prev, 
          cvText: "Alex Johnson - Senior Full Stack Engineer with 6+ years of experience building scalable fintech solutions in Lagos and Nairobi. Proficient in React, Node.js, and Cloud Infrastructure (AWS). Led a team of 10 to deliver a Pan-African payment gateway processing $1M+ daily." 
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
    localStorage.removeItem('active_interview_transcript');
    sessionStorage.setItem('current_interview', JSON.stringify(form));
    navigate('/interview');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative pb-12">
      
      {/* Visual Stepper */}
      <div className="flex items-center justify-between mb-12 px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 transform ${
              step === s ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 rotate-3 scale-110' : step > s ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              {step > s ? <i className="fas fa-check"></i> : s}
            </div>
            {s < 3 && <div className={`h-0.5 flex-grow mx-4 rounded-full ${step > s ? 'bg-emerald-600' : 'bg-slate-800'}`}></div>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Professional Context</h2>
                <p className="text-slate-500 text-sm">Tell us about the role you're targeting.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Role</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Senior Product Manager" 
                      className="w-full bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                      value={form.jobRole}
                      onChange={e => setForm(prev => ({ ...prev, jobRole: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Industry</label>
                    <input 
                      type="text" 
                      placeholder="e.g. FinTech / SaaS" 
                      className="w-full bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                      value={form.industry}
                      onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Location / Market</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Lagos, Nigeria or Remote" 
                    className="w-full bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                    value={form.jobLocation}
                    onChange={e => setForm(prev => ({ ...prev, jobLocation: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Description</label>
                  <textarea 
                    rows={4}
                    placeholder="Paste the key requirements..." 
                    className="w-full bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 transition-all outline-none resize-none"
                    value={form.jobDescription}
                    onChange={e => setForm(prev => ({ ...prev, jobDescription: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl h-full">
              <h3 className="font-bold text-slate-200">Resume Deep-Scan</h3>
              <div className="relative border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer group h-64 flex flex-col items-center justify-center">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                {isScanning ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-emerald-400 animate-pulse">EXTRACTING TALENT DATA...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-emerald-600 transition-all">
                      <i className={`fas ${form.cvText ? 'fa-check text-emerald-400 group-hover:text-white' : 'fa-cloud-upload-alt text-slate-500 group-hover:text-white'} text-2xl`}></i>
                    </div>
                    <div>
                      <p className="text-slate-300 font-bold text-sm">{form.cvText ? 'CV Uploaded' : 'Upload CV'}</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">PDF, DOCX, or Image</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Status</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {form.cvText ? "Data extracted. We've identified your key skillsets for the analysis phase." : "Waiting for CV upload to begin profile benchmarking."}
                </p>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!form.jobRole || !form.jobDescription || !form.cvText}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-xl shadow-emerald-900/20"
              >
                Configure Session
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-bold mb-8 text-white">Market & Rigor Setup</h2>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Market Focus</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {regions.map(r => (
                    <button
                      key={r}
                      onClick={() => setForm(prev => ({ ...prev, region: r }))}
                      className={`p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${
                        form.region === r ? 'border-emerald-600 bg-emerald-900/20 text-emerald-400' : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Interview Intensity</label>
                <div className="grid grid-cols-3 gap-4">
                  {Object.values(Difficulty).map(d => (
                    <button
                      key={d}
                      onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                      className={`py-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center ${
                        form.difficulty === d ? 'border-blue-600 bg-blue-900/20 text-blue-400' : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm">{d}</span>
                      <span className="text-[8px] mt-1 opacity-60 uppercase tracking-tighter">
                        {d === Difficulty.HARD ? "FAANG Level" : d === Difficulty.MEDIUM ? "Pro Standard" : "Basic Fit"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500">
                    <i className="fas fa-random text-xl"></i>
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">Adaptive Questioning</p>
                    <p className="text-xs text-slate-500">The AI will vary topics based on your performance.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setForm(prev => ({ ...prev, isRandomized: !prev.isRandomized }))}
                  className={`w-14 h-8 rounded-full transition-colors relative ${form.isRandomized ? 'bg-emerald-600' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${form.isRandomized ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            <div className="flex space-x-4 mt-12">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all">Back</button>
              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all flex items-center justify-center space-x-3 shadow-xl"
              >
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-microscope"></i>}
                <span>{loading ? 'Synthesizing Profile...' : 'Finalize & Analyze'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && analysis && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <i className="fas fa-award text-9xl text-emerald-500"></i>
            </div>
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white leading-tight">Pre-Interview Dossier</h2>
                  <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mt-1">Ready for {form.region} Market</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-500 uppercase font-black">Role Benchmarked</p>
                   <p className="text-lg font-bold text-slate-200">{form.jobRole}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4">Executive Summary</h3>
                    <p className="text-sm text-slate-300 italic leading-relaxed">"{analysis.summary}"</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Skill Matching</h3>
                    <div className="space-y-3">
                      {analysis.skillGaps.map((gap: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-4">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${gap.status === 'matched' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : gap.status === 'partial' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                          <div>
                            <p className="text-xs font-bold text-slate-100">{gap.skill}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{gap.advice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl">
                      <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest mb-4">Core Strengths</h3>
                      <ul className="space-y-3">
                        {analysis.strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-center space-x-3 text-sm text-slate-300">
                            <i className="fas fa-check-circle text-emerald-500 text-xs"></i>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                   </div>

                   <div className="p-6 bg-blue-950/10 border border-blue-900/30 rounded-2xl">
                      <h3 className="text-xs font-black uppercase text-blue-400 tracking-widest mb-4">Market Intelligence</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{analysis.marketInsights}</p>
                   </div>
                   
                   <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Interviewer Insight</p>
                      <p className="text-xs text-slate-400 italic">"The hiring manager for this role will likely focus on your ability to scale systems across fragmented markets. Be ready to discuss regional regulations."</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={startInterview}
                className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/40 transform hover:-translate-y-1"
              >
                Launch Live Interview Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreparationFlow;
