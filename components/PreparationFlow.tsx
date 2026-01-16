
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Difficulty, InterviewState } from '../types';
import { analyzeJobContext } from '../services/geminiService';

const PreparationFlow: React.FC<{ user: UserProfile, onSaveState?: (state: InterviewState) => void }> = ({ user, onSaveState }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [showHandshake, setShowHandshake] = useState(false);
  
  const [form, setForm] = useState<InterviewState>({
    cvText: '',
    jobDescription: '',
    jobRole: '',
    jobLocation: '',
    industry: '',
    difficulty: Difficulty.MEDIUM,
    isRandomized: false
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd use a PDF/Docx parser here.
      setForm(prev => ({ ...prev, cvText: "Extracted text from CV: Senior Professional with global experience in technology and finance. Expertise in scaling international teams and driving high-impact projects." }));
    }
  };

  const goToStep2 = () => {
    setShowHandshake(true);
    setTimeout(() => {
      setShowHandshake(false);
      setStep(2);
    }, 2000);
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
    // Clear any previous active transcript when starting fresh
    localStorage.removeItem('active_interview_transcript');
    sessionStorage.setItem('current_interview', JSON.stringify(form));
    navigate('/interview');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Handshake/Success Overlay */}
      {showHandshake && (
        <div className="fixed top-24 right-10 z-50 animate-slide-in-right">
          <div className="glass border border-emerald-400 bg-emerald-900/20 p-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-2 success-glow">
             <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-3xl animate-bounce">
                <i className="fas fa-handshake"></i>
             </div>
             <div className="text-center">
               <p className="font-bold text-emerald-100">Profile Analyzed!</p>
               <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Standardizing against industry benchmarks...</p>
             </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
              step === s ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.5)]' : step > s ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              {step > s ? <i className="fas fa-check"></i> : s}
            </div>
            {s < 3 && <div className={`h-1 flex-grow mx-4 rounded ${step > s ? 'bg-emerald-600' : 'bg-slate-800'}`}></div>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-800 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Step 1: Global Context</h2>
              <p className="text-slate-500">Provide details for your target international role.</p>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase font-bold tracking-widest">Setup</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Target Job Role</label>
                <input 
                  type="text" 
                  placeholder="e.g. Senior Software Engineer" 
                  className="w-full bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  value={form.jobRole}
                  onChange={e => setForm(prev => ({ ...prev, jobRole: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Domain / Industry</label>
                <input 
                  type="text" 
                  placeholder="e.g. FinTech, Healthcare, AI" 
                  className="w-full bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  value={form.industry}
                  onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                />
              </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Job Location (City, Country or Remote)</label>
                <input 
                  type="text" 
                  placeholder="e.g. London, UK or Remote (Global)" 
                  className="w-full bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  value={form.jobLocation}
                  onChange={e => setForm(prev => ({ ...prev, jobLocation: e.target.value }))}
                />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Job Description</label>
              <textarea 
                rows={4}
                placeholder="Paste the international job requirements here..." 
                className="w-full bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
                value={form.jobDescription}
                onChange={e => setForm(prev => ({ ...prev, jobDescription: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Upload CV / Resume (International Standard)</label>
              <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-emerald-500 hover:bg-slate-800/50 transition-all cursor-pointer group">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                <div className="space-y-2">
                  <i className="fas fa-cloud-upload-alt text-4xl text-slate-600 group-hover:text-emerald-500 transition-colors"></i>
                  <p className="text-slate-500">{form.cvText ? 'Document Uploaded Successfully' : 'Drag and drop or click to upload your Resume'}</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={goToStep2}
            disabled={!form.jobRole || !form.industry || !form.jobDescription || !form.cvText || !form.jobLocation}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            Continue to Preferences
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-800 space-y-8">
          <h2 className="text-2xl font-bold text-slate-100">Step 2: Session Customization</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Rigor / Difficulty Level</label>
              <div className="grid grid-cols-3 gap-4">
                {Object.values(Difficulty).map(d => (
                  <button
                    key={d}
                    onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                    className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                      form.difficulty === d ? 'border-emerald-600 bg-emerald-900/30 text-emerald-400' : 'border-slate-800 bg-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-800">
              <div>
                <p className="font-semibold text-slate-200">Global Standard Randomization</p>
                <p className="text-xs text-slate-500">Test adaptability across diverse domain topics.</p>
              </div>
              <button 
                onClick={() => setForm(prev => ({ ...prev, isRandomized: !prev.isRandomized }))}
                className={`w-14 h-8 rounded-full transition-colors relative ${form.isRandomized ? 'bg-emerald-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${form.isRandomized ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="p-4 bg-amber-900/20 text-amber-200 rounded-xl flex items-start space-x-3 border border-amber-900/30">
              <i className="fas fa-crown mt-1 text-amber-500"></i>
              <div>
                <p className="text-sm font-bold">Global Pro Perk</p>
                <p className="text-xs opacity-80">Premium users receive localized market insights for ${form.jobLocation} and industry competitors in the ${form.industry} space.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700">Back</button>
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
              <span>{loading ? 'Performing Deep Analysis...' : 'Finalize & Prepare'}</span>
            </button>
          </div>
        </div>
      )}

      {step === 3 && analysis && (
        <div className="bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-800 space-y-6">
          <div className="flex items-center space-x-3 text-emerald-400 mb-2">
            <i className="fas fa-check-circle text-2xl"></i>
            <h2 className="text-2xl font-bold">Standard Analysis for {form.industry}!</h2>
          </div>
          
          <div className="p-6 bg-slate-800/50 rounded-2xl whitespace-pre-wrap text-slate-300 italic border-l-4 border-emerald-500">
            "{analysis}"
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-emerald-900/30 rounded-xl bg-emerald-900/10">
              <h3 className="font-bold text-emerald-400 mb-2 flex items-center">
                <i className="fas fa-bolt mr-2"></i>International Tips
              </h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Emphasize global industry best practices</li>
                <li>• Focus on scalable solutions and impact</li>
                <li>• Align with international professional standards</li>
              </ul>
            </div>
            <div className="p-4 border border-blue-900/30 rounded-xl bg-blue-900/10">
              <h3 className="font-bold text-blue-400 mb-2 flex items-center">
                <i className="fas fa-info-circle mr-2"></i>Global Studio Rules
              </h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• ~15-20 min high-rigor session</li>
                <li>• Real-time international market AI</li>
                <li>• Professional voice analysis enabled</li>
              </ul>
            </div>
          </div>

          <button 
            onClick={startInterview}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transform hover:-translate-y-1 transition-all shadow-xl shadow-emerald-900/20"
          >
            Enter Global Interview Studio
          </button>
        </div>
      )}
    </div>
  );
};

export default PreparationFlow;
