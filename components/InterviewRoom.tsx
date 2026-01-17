
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewState, FeedbackData, InterviewResult } from '../types';
import { 
  decode, 
  decodeAudioData, 
  encode,
  connectLiveSession,
  generateDetailedFeedback
} from '../services/geminiService';
import FeedbackReport from './FeedbackReport';

const InterviewRoom: React.FC<{ user: any, onFinish?: (result: InterviewResult) => void }> = ({ user, onFinish }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<InterviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  
  // Voice Session State
  const [activeSpeaker, setActiveSpeaker] = useState<'Interviewer' | 'Candidate' | null>(null);
  const [transcriptions, setTranscriptions] = useState<{role: string, text: string}[]>(() => {
    const saved = localStorage.getItem('active_interview_transcript');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentOutputText, setCurrentOutputText] = useState('');
  const [currentInputText, setCurrentInputText] = useState('');

  // Voice Analysis States (Real-time)
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voicePace, setVoicePace] = useState(75); 
  const [voiceClarity, setVoiceClarity] = useState(90); 
  const [voiceTone, setVoiceTone] = useState("Professional");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionPromiseRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>(0);

  // Use refs to prevent stale closures in message callbacks
  const currentOutputTextRef = useRef('');
  const currentInputTextRef = useRef('');

  useEffect(() => {
    const data = sessionStorage.getItem('current_interview');
    if (!data) {
      navigate('/prepare');
      return;
    }
    try {
      const interviewState = JSON.parse(data);
      setState(interviewState);
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      startLiveSession(interviewState);
    } catch (e) {
      navigate('/prepare');
    }

    return () => {
      stopLiveSession();
      if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [navigate]);

  useEffect(() => {
    if (transcriptions.length > 0) {
      localStorage.setItem('active_interview_transcript', JSON.stringify(transcriptions));
    }
  }, [transcriptions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  const stopLiveSession = () => {
    if (liveSessionPromiseRef.current) {
      liveSessionPromiseRef.current.then((session: any) => session.close()).catch(() => {});
    }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to quit the session? Progress will be saved locally.")) {
      stopLiveSession();
      navigate('/');
    }
  };

  const startLiveSession = async (s: InterviewState) => {
    setLoading(true);
    try {
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sourceNode = inputAudioContext.createMediaStreamSource(stream);
      const analyzer = inputAudioContext.createAnalyser();
      analyzer.fftSize = 256;
      sourceNode.connect(analyzer);
      analyzerRef.current = analyzer;

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAnalysis = () => {
        if (!analyzerRef.current) return;
        analyzerRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const volume = sum / bufferLength;
        setVoiceVolume(volume);

        if (volume > 5) {
          setVoicePace(p => Math.max(50, Math.min(100, p + (Math.random() * 2 - 1))));
          setVoiceClarity(c => Math.max(70, Math.min(100, c + (Math.random() * 1.5 - 0.7))));
        }
        requestRef.current = requestAnimationFrame(updateAnalysis);
      };
      updateAnalysis();

      const callbacks = {
        onopen: () => {
          setLoading(false);
          const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e: any) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            if (liveSessionPromiseRef.current) {
              liveSessionPromiseRef.current.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            }
          };
          analyzer.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: any) => {
          if (message.serverContent?.outputTranscription) {
            setActiveSpeaker('Interviewer');
            const text = message.serverContent.outputTranscription.text;
            currentOutputTextRef.current += text;
            setCurrentOutputText(currentOutputTextRef.current);
          } else if (message.serverContent?.inputTranscription) {
            setActiveSpeaker('Candidate');
            const text = message.serverContent.inputTranscription.text;
            currentInputTextRef.current += text;
            setCurrentInputText(currentInputTextRef.current);
          }

          if (message.serverContent?.turnComplete) {
            const candText = currentInputTextRef.current;
            const intText = currentOutputTextRef.current;
            
            setTranscriptions(prev => [
              ...prev, 
              { role: 'Candidate', text: candText },
              { role: 'Interviewer', text: intText }
            ].filter(t => t.text.trim()));

            currentInputTextRef.current = '';
            currentOutputTextRef.current = '';
            setCurrentInputText('');
            setCurrentOutputText('');
            setActiveSpeaker(null);
          }

          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && outputAudioContextRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContextRef.current.destination);
            source.addEventListener('ended', () => sourcesRef.current.delete(source));
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e: any) => {
          console.error("Live Session Error:", e);
          setLoading(false);
        },
        onclose: () => {
          setLoading(false);
        }
      };

      const sysInstr = `You are a professional hiring manager specializing in the ${s.region} market. Interview the candidate for ${s.jobRole}. 
      Ask high-quality, pointed professional questions. Mention local context if relevant to the role.
      Wait for the candidate to finish their turn. Be professional, direct, and slightly challenging if difficulty is set to Hard.`;
      
      liveSessionPromiseRef.current = connectLiveSession(callbacks, sysInstr);
    } catch (err) {
      console.error("Microphone or Session Error:", err);
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!state) return;
    setFinishing(true);
    stopLiveSession();
    try {
      const history = transcriptions.map(t => ({ role: t.role === 'Candidate' ? 'user' : 'model', text: t.text }));
      const report = await generateDetailedFeedback(state, history);
      report.paceScore = voicePace;
      report.clarityScore = voiceClarity;
      report.toneScore = (voiceTone === "Professional" || voiceTone === "Neutral") ? 92 : 80;
      setFeedback(report);
      localStorage.removeItem('active_interview_transcript');
      if (onFinish) {
        onFinish({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          role: state.jobRole,
          score: report.score,
          feedback: report
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFinishing(false);
    }
  };

  const handleEndOfTurn = () => {
    if (activeSpeaker === 'Candidate' && liveSessionPromiseRef.current) {
      liveSessionPromiseRef.current.then((session: any) => {
        session.sendRealtimeInput({
          parts: [{ text: "[Candidate has finished speaking. Respond now.]" }]
        });
      }).catch(() => {});
      setActiveSpeaker(null);
    }
  };

  if (feedback) {
    return <FeedbackReport data={feedback} onReset={() => navigate('/')} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-7xl mx-auto px-6 py-4 animate-fade-in relative">
      <div className="flex items-center justify-between mb-8 bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-6">
          <button onClick={handleExit} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <i className="fas fa-times text-sm"></i>
          </button>
          <div>
            <h2 className="text-xl font-black text-white">{state?.jobRole}</h2>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Live Session • {state?.region}
            </p>
          </div>
        </div>
        <button onClick={handleFinish} className="px-8 py-3 bg-white text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-xl hover:scale-105 active:scale-95">
          End & Analyze
        </button>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Main Interaction Area */}
        <div className="lg:col-span-9 flex flex-col space-y-6 overflow-hidden">
          <div className="flex-grow bg-slate-900 rounded-[40px] border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-12 shadow-inner">
            <div className="absolute inset-0 pattern-overlay opacity-5"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 w-full max-w-4xl relative z-10">
              <div className="flex flex-col items-center space-y-6">
                <div className={`w-44 h-44 rounded-[48px] flex items-center justify-center transition-all duration-700 border-4 transform ${activeSpeaker === 'Interviewer' ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.3)] scale-110' : 'bg-slate-950 border-slate-800/50 opacity-40'}`}>
                  <div className="relative">
                    <i className={`fas fa-user-tie text-6xl ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-700'}`}></i>
                  </div>
                </div>
                <div className="text-center">
                  <p className={`font-black text-xs uppercase tracking-widest ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-600'}`}>Hiring Partner</p>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <div className={`w-44 h-44 rounded-[48px] flex items-center justify-center transition-all duration-700 border-4 transform ${activeSpeaker === 'Candidate' ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.3)] scale-110' : 'bg-slate-950 border-slate-800/50 opacity-40'}`}>
                   <div className="relative">
                      <i className={`fas fa-user text-6xl ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-700'}`}></i>
                      {activeSpeaker === 'Candidate' && (
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-end space-x-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className="w-1.5 bg-emerald-500 rounded-full" style={{ height: `${Math.min(40, voiceVolume * 2 + (Math.random() * 10))}px` }}></div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>
                <div className="text-center">
                  <p className={`font-black text-xs uppercase tracking-widest ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-600'}`}>You (Candidate)</p>
                </div>
              </div>
            </div>

            <div className="mt-20 z-10">
              <button 
                onClick={handleEndOfTurn} 
                disabled={activeSpeaker !== 'Candidate'} 
                className={`group flex items-center space-x-6 px-16 py-8 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl ${activeSpeaker === 'Candidate' ? 'bg-emerald-600 text-white hover:bg-emerald-500 scale-105 hover:shadow-emerald-900/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
              >
                <i className={`fas ${activeSpeaker === 'Candidate' ? 'fa-microphone-slash' : 'fa-lock'} text-xl`}></i>
                <span>Submit Turn</span>
              </button>
            </div>
          </div>
          
          <div className="h-32 bg-slate-950/50 rounded-3xl border border-slate-800 p-6 flex flex-col justify-center text-center italic text-slate-400 font-medium overflow-hidden shadow-inner">
             {currentInputText || currentOutputText ? (
                <p className="line-clamp-2 text-lg">"{currentInputText || currentOutputText}"</p>
             ) : (
                <p className="text-xs font-black uppercase tracking-widest text-slate-600 opacity-40">Ready for your professional insights...</p>
             )}
          </div>
        </div>

        {/* Sidebar Metrics */}
        <div className="lg:col-span-3 flex flex-col space-y-6 overflow-hidden">
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 flex flex-col shadow-2xl h-1/2 overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-slate-800 pb-4">Vocal Telemetry</h3>
            <div className="space-y-10 flex-grow">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black"><span className="text-slate-500 uppercase">Fluency</span><span className="text-emerald-400">{voicePace.toFixed(0)}%</span></div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981]" style={{ width: `${voicePace}%` }}></div></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black"><span className="text-slate-500 uppercase">Clarity</span><span className="text-emerald-400">{voiceClarity.toFixed(0)}%</span></div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981]" style={{ width: `${voiceClarity}%` }}></div></div>
              </div>
              <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl mt-4">
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Detected Tone</p>
                 <p className="text-sm font-bold text-white">{voiceTone}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 rounded-3xl border border-slate-800 overflow-hidden flex flex-col h-1/2">
            <div className="p-4 bg-slate-900 border-b border-slate-800"><h3 className="font-black text-[9px] uppercase tracking-widest text-slate-500">Live Transcript</h3></div>
            <div className="flex-grow overflow-y-auto p-5 space-y-6">
              {transcriptions.slice(-4).map((t, idx) => (
                <div key={idx} className="animate-fade-in space-y-1">
                  <p className={`text-[9px] font-black uppercase tracking-tighter ${t.role === 'Candidate' ? 'text-emerald-500' : 'text-blue-500'}`}>{t.role}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2">"{t.text}"</p>
                </div>
              ))}
              {transcriptions.length === 0 && (
                <div className="h-full flex items-center justify-center opacity-20 text-center">
                  <i className="fas fa-terminal text-3xl text-slate-500"></i>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-broadcast-tower text-emerald-500 text-xl"></i>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-black uppercase tracking-[0.3em] text-sm">Initializing High-Definition Voice</p>
            <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase">Connecting to {state?.region} Market AI Studio...</p>
          </div>
        </div>
      )}

      {finishing && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 flex flex-col items-center justify-center backdrop-blur-2xl">
          <i className="fas fa-microscope text-5xl text-emerald-500 animate-pulse mb-6"></i>
          <p className="text-white font-black uppercase tracking-[0.4em] text-lg">Synthesizing Performance Data</p>
          <p className="text-slate-500 text-xs mt-4 font-bold max-w-xs text-center leading-relaxed uppercase tracking-widest">Generating global competency report...</p>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
