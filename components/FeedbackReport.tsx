
import React from 'react';
import { FeedbackData } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const FeedbackReport: React.FC<{ data: FeedbackData, onReset: () => void }> = ({ data, onReset }) => {
  const chartData = [
    { subject: 'Technical', A: data.technicalAccuracy, fullMark: 100 },
    { subject: 'Comm.', A: data.communicationSkills, fullMark: 100 },
    { subject: 'Confidence', A: data.confidence, fullMark: 100 },
    { subject: 'Tone', A: data.toneScore, fullMark: 100 },
    { subject: 'Pace', A: data.paceScore, fullMark: 100 },
    { subject: 'Clarity', A: data.clarityScore, fullMark: 100 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in zoom-in-95 duration-700 pb-20">
      <div className="bg-slate-900 p-10 md:p-14 rounded-[40px] shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 space-y-8 md:space-y-0">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black text-slate-100 tracking-tight">Performance Ecosystem</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Dossier ID: HP-{Math.floor(Math.random() * 9000) + 1000}</p>
          </div>
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="88" cy="88" r="82" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
              <circle cx="88" cy="88" r="82" stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={515.2}
                strokeDashoffset={515.2 - (515.2 * data.score) / 100}
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-white">{data.score}</span>
              <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mt-1">Global Index</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          <div className="h-96 bg-slate-950 rounded-[40px] p-8 border border-slate-800 shadow-inner relative">
            <div className="absolute top-6 left-8 text-[9px] font-black uppercase text-slate-600 tracking-[0.2em]">Global Competency Map</div>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 10, fontWeight: 'black'}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                <Radar name="Candidate" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tech Precision</span>
                    <span className="text-lg font-black text-emerald-400">{data.technicalAccuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${data.technicalAccuracy}%` }}></div>
                  </div>
               </div>
               <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Communication</span>
                    <span className="text-lg font-black text-blue-400">{data.communicationSkills}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${data.communicationSkills}%` }}></div>
                  </div>
               </div>
               <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confidence</span>
                    <span className="text-lg font-black text-amber-400">{data.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${data.confidence}%` }}></div>
                  </div>
               </div>
               <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Clarity Index</span>
                    <span className="text-lg font-black text-white">{data.clarityScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full transition-all duration-1000" style={{ width: `${data.clarityScore}%` }}></div>
                  </div>
               </div>
            </div>
            
            <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl">
              <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-3">Market Competitive Insight</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">"{data.marketInsights || "Benchmarked against international industry standards and regional market benchmarks."}"</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <div className="p-10 bg-emerald-950/20 rounded-[40px] border border-emerald-900/30">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-400 mb-8 flex items-center">
              <i className="fas fa-crown mr-4"></i> Competitive Advantage
            </h3>
            <ul className="space-y-5 text-sm text-slate-300">
              {data.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start space-x-4">
                  <div className="mt-1.5 w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="leading-relaxed font-medium">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-10 bg-red-950/20 rounded-[40px] border border-red-900/30">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-red-400 mb-8 flex items-center">
              <i className="fas fa-bullseye mr-4"></i> Critical Growth Areas
            </h3>
            <ul className="space-y-5 text-sm text-slate-300">
              {data.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start space-x-4">
                  <div className="mt-1.5 w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="leading-relaxed font-medium">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-10 bg-slate-950 rounded-[40px] border border-slate-800 mb-12">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center">
            <i className="fas fa-magic mr-4"></i> High-Impact Recommendations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.suggestions.map((s, idx) => (
              <div key={idx} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col space-y-4 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-2xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-bolt text-blue-400 text-xs"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-100 leading-tight">"{s.text}"</p>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    <span className="font-black text-blue-500 uppercase mr-1">Context:</span>
                    {s.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <button 
            onClick={onReset}
            className="flex-1 py-6 bg-slate-800 text-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all border border-slate-700"
          >
            Return to HQ
          </button>
          <button 
            onClick={() => window.print()}
            className="flex-1 py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all flex items-center justify-center space-x-4 shadow-2xl shadow-emerald-900/40"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Export Full Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackReport;
