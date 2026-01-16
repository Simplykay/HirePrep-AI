
import React from 'react';
import { FeedbackData } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const FeedbackReport: React.FC<{ data: FeedbackData, onReset: () => void }> = ({ data, onReset }) => {
  const chartData = [
    { subject: 'Technical', A: data.technicalAccuracy, fullMark: 100 },
    { subject: 'Communication', A: data.communicationSkills, fullMark: 100 },
    { subject: 'Confidence', A: data.confidence, fullMark: 100 },
    { subject: 'Vocal Tone', A: data.toneScore, fullMark: 100 },
    { subject: 'Speech Pace', A: data.paceScore, fullMark: 100 },
    { subject: 'Clarity', A: data.clarityScore, fullMark: 100 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-12">
      <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold text-slate-100">Performance Ecosystem</h2>
            <p className="text-slate-500">Comprehensive breakdown of your global interview readiness.</p>
          </div>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="66" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-800" />
              <circle cx="72" cy="72" r="66" stroke="currentColor" strokeWidth="10" fill="transparent" 
                strokeDasharray={414.7}
                strokeDashoffset={414.7 - (414.7 * data.score) / 100}
                className="text-emerald-500 transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-emerald-400">{data.score}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Index</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          <div className="h-80 md:h-[450px] bg-slate-950/50 rounded-3xl p-6 border border-slate-800/50 relative">
            <div className="absolute top-4 left-6 text-[10px] font-black uppercase text-slate-600 tracking-widest">Global Competency Map</div>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                <Radar name="Candidate" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Technical Precision</span>
                <span className="text-xs font-black text-emerald-400">{data.technicalAccuracy}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.5)]" style={{ width: `${data.technicalAccuracy}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Communication Impact</span>
                <span className="text-xs font-black text-blue-400">{data.communicationSkills}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.5)]" style={{ width: `${data.communicationSkills}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vocal Health & Tone</span>
                <span className="text-xs font-black text-amber-400">{data.toneScore}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-1000 shadow-[0_0_12px_rgba(245,158,11,0.5)]" style={{ width: `${data.toneScore}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
               <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Speech Pace</p>
                  <p className="text-xl font-black text-white">{data.paceScore}%</p>
               </div>
               <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Voice Clarity</p>
                  <p className="text-xl font-black text-white">{data.clarityScore}%</p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-8 bg-emerald-900/10 rounded-3xl border border-emerald-900/20 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-widest text-emerald-400 mb-6 flex items-center">
              <i className="fas fa-gem mr-3"></i> Elite Strengths
            </h3>
            <ul className="space-y-4 text-sm text-slate-300">
              {data.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 bg-red-900/10 rounded-3xl border border-red-900/20 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-widest text-red-400 mb-6 flex items-center">
              <i className="fas fa-crosshairs mr-3"></i> Growth Targets
            </h3>
            <ul className="space-y-4 text-sm text-slate-300">
              {data.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-8 bg-blue-900/10 rounded-3xl border border-blue-900/20 mb-10">
          <h3 className="font-black text-sm uppercase tracking-widest text-blue-400 mb-6 flex items-center">
            <i className="fas fa-magic mr-3"></i> Tactical Optimization
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.suggestions.map((s, idx) => (
              <div key={idx} className="bg-slate-800/60 p-5 rounded-2xl shadow-sm border border-slate-700/50 flex flex-col space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-lightbulb text-[10px] text-blue-400"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-100 leading-tight">"{s.text}"</p>
                </div>
                <div className="pt-2 border-t border-slate-700/30">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    <span className="font-bold text-blue-500/80 uppercase mr-1">Rationale:</span>
                    {s.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button 
            onClick={onReset}
            className="flex-1 py-5 bg-slate-800 text-slate-200 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700 uppercase text-xs tracking-widest"
          >
            Dashboard
          </button>
          <button 
            onClick={() => window.print()}
            className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-emerald-900/30 uppercase text-xs tracking-widest"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Download Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackReport;
