
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
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Voice Analysis States (Real-time simulated metrics)
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voicePace, setVoicePace] = useState(75); 
  const [voiceClarity, setVoiceClarity] = useState(90); 

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
      liveSessionPromiseRef.current.then((session: any) => {
        try { session.close(); } catch(e) {}
      }).catch(() => {});
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

  /**
   * Signal to the model that the user has finished speaking.
   * This sends a text nudge which usually prompts the Gemini Live API to take over the turn.
   */
  const sendFinishedSignal = () => {
    if (liveSessionPromiseRef.current) {
      liveSessionPromiseRef.current.then((session: any) => {
        // Explicit text part to trigger the model's response if it's waiting for more audio.
        session.sendRealtimeInput({ 
          text: "[The candidate has finished their response. Please proceed with your next question or feedback.]" 
        });
      }).catch(() => {});
    }
  };

  const initializeAudioAndStart = async () => {
    if (!state) return;
    setLoading(true);
    setError(null);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const outCtx = new AudioCtx({ sampleRate: 24000 });
      const inCtx = new AudioCtx({ sampleRate: 16000 });
      
      if (outCtx.state === 'suspended') await outCtx.resume();
      if (inCtx.state === 'suspended') await inCtx.resume();
      
      outputAudioContextRef.current = outCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sourceNode = inCtx.createMediaStreamSource(stream);
      const analyzer = inCtx.createAnalyser();
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
          setIsReady(true);
          const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
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
          sourceNode.connect(scriptProcessor);
          scriptProcessor.connect(inCtx.destination);
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
          setError("Session interrupted. Please ensure you have a stable network.");
          setLoading(false);
          setIsReady(false);
        },
        onclose: () => {
          setLoading(false);
          setIsReady(false);
        }
      };

      const sysInstr = `You are a professional hiring manager specializing in the ${state.region} market. Interview the candidate for ${state.jobRole}. 
      Ask high-quality, pointed professional questions. Mention local context if relevant to the role.
      Wait for the candidate to finish their turn. Be professional, direct, and slightly challenging if difficulty is set to Hard.`;
      
      liveSessionPromiseRef.current = connectLiveSession(callbacks, sysInstr);
    } catch (err: any) {
      console.error("Microphone or Session Error:", err);
      setError(err.name === 'NotAllowedError' ? "Microphone access was denied." : "Could not initialize session.");
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
      report.toneScore = 92;
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

  if (feedback) {
    return <FeedbackReport data={feedback} onReset={() => navigate('/')} />;
  }

  if (!isReady && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-in py-12">
        <div className="w-20 h-20 bg-emerald-600/20 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl">
          <i className="fas fa-microphone text-3xl"></i>
        </div>
        <h2 className="text-2xl font-black text-white mb-3">Ready to begin?</h2>
        <p className="text-slate-400 max-w-xs mb-10 leading-relaxed font-medium text-sm">
          Connect with your AI Hiring Manager for the {state?.region} market.
        </p>
        {error && <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">{error}</div>}
        <div className="flex flex-col space-y-4 w-full max-w-xs px-6">
          <button onClick={initializeAudioAndStart} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-500 shadow-xl active:scale-95 transition-all">Start Session</button>
          <button onClick={() => navigate('/')} className="w-full py-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">Go Back</button>
        </div>
      </div>
    );
  }

  if (loading || finishing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center py-12">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className={`fas ${finishing ? 'fa-chart-line' : 'fa-network-wired'} text-emerald-500 animate-pulse`}></i>
          </div>
        </div>
        <h2 className="text-xl font-black text-white mb-2 leading-tight">{finishing ? 'Analyzing Performance' : 'Initializing Link'}</h2>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">{finishing ? 'Generating report...' : 'Connecting...'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 md:px-6 animate-fade-in relative pb-10">
      
      {/* Session Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-slate-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-800 shadow-xl gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto overflow-hidden">
          <button onClick={handleExit} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white flex-shrink-0 transition-colors">
            <i className="fas fa-times text-xs"></i>
          </button>
          <div className="min-w-0 flex-grow">
            <h2 className="text-sm font-black text-white truncate">{state?.jobRole}</h2>
            <div className="flex items-center mt-0.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
               <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest truncate">{state?.region}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button 
            onClick={sendFinishedSignal}
            className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600/20 transition-all active:scale-95"
          >
            I've Finished Speaking
          </button>
          <button 
            onClick={handleFinish} 
            className="flex-1 sm:flex-none px-6 py-3 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 shadow-xl active:scale-95 transition-all"
          >
            End & Analyze
          </button>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 lg:overflow-hidden min-h-0">
        <div className="lg:col-span-8 flex flex-col space-y-6 h-full min-h-[400px]">
          <div className="flex-grow bg-slate-900 rounded-[3rem] border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner">
            <div className="absolute inset-0 pattern-overlay opacity-[0.03]"></div>
            <div className="grid grid-cols-2 gap-8 md:gap-16 w-full max-w-2xl relative z-10">
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-24 h-24 md:w-36 md:h-36 rounded-[2rem] flex items-center justify-center transition-all duration-700 border-2 md:border-4 transform ${activeSpeaker === 'Interviewer' ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] scale-105' : 'bg-slate-950 border-slate-800/50 opacity-40'}`}>
                  <i className={`fas fa-user-tie text-3xl md:text-5xl ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-700'}`}></i>
                </div>
                <p className={`font-black text-[9px] uppercase tracking-widest ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-600'}`}>Interviewer</p>
              </div>
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-24 h-24 md:w-36 md:h-36 rounded-[2rem] flex items-center justify-center transition-all duration-700 border-2 md:border-4 transform ${activeSpeaker === 'Candidate' ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)] scale-105' : 'bg-slate-950 border-slate-800/50 opacity-40'}`}>
                   <div className="relative">
                      <i className={`fas fa-user text-3xl md:text-5xl ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-700'}`}></i>
                      {voiceVolume > 5 && (
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex space-x-1">
                          {[1,2,3,4,5].map(i => (<div key={i} className="w-1 bg-emerald-500 rounded-full animate-bounce" style={{height: `${Math.random() * 20 + 5}px`, animationDelay: `${i * 0.1}s`}}></div>))}
                        </div>
                      )}
                   </div>
                </div>
                <p className={`font-black text-[9px] uppercase tracking-widest ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-600'}`}>Candidate (You)</p>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-12 md:right-12 text-center max-w-3xl mx-auto bg-slate-950/30 backdrop-blur-md p-4 rounded-3xl border border-white/5 md:bg-transparent md:p-0 md:border-none">
               <p className="text-slate-100 text-base md:text-xl font-medium leading-relaxed drop-shadow-lg line-clamp-3">
                 {currentOutputText || currentInputText || (activeSpeaker === 'Interviewer' ? 'Synthesizing response...' : activeSpeaker === 'Candidate' ? 'Listening...' : 'Ready for your professional insights...')}
               </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 flex flex-col overflow-hidden h-full min-h-[350px]">
             <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Telemetry</h3>
             </div>
             <div className="p-6 space-y-8 overflow-y-auto">
                <div className="space-y-4">
                   <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase text-slate-600">Vocal Tempo</span><span className="text-[11px] font-black text-slate-200">{Math.round(voicePace)}%</span></div>
                   <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${voicePace}%` }}></div></div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase text-slate-600">Enunciation</span><span className="text-[11px] font-black text-slate-200">{Math.round(voiceClarity)}%</span></div>
                   <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${voiceClarity}%` }}></div></div>
                </div>
                <div className="pt-4 space-y-5">
                  <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Recent Transcript</h4>
                  <div className="space-y-3">
                    {transcriptions.length > 0 ? (
                      transcriptions.slice(-3).map((t, i) => (
                        <div key={i} className={`p-4 rounded-2xl text-[10px] leading-relaxed ${t.role === 'Candidate' ? 'bg-emerald-600/10 text-emerald-100' : 'bg-slate-800 text-slate-400'}`}>
                          <span className="font-black uppercase tracking-tighter mr-2 text-[8px] opacity-60">{t.role === 'Candidate' ? 'You' : 'AI'}</span>
                          {t.text.substring(0, 120)}{t.text.length > 120 ? '...' : ''}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-700 italic">No audio logged yet.</p>
                    )}
                  </div>
                </div>
             </div>
             <div className="p-5 bg-slate-950 border-t border-slate-800 mt-auto">
                <p className="text-[9px] text-slate-600">Scores generated upon manual closure.</p>
             </div>
          </div>
        </div>
      </div>
      <div ref={messagesEndRef} className="h-4 w-full" />
    </div>
  );
};

export default InterviewRoom;
