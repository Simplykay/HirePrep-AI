
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewState, Message, FeedbackData, InterviewResult } from '../types';
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
    return saved ? JSON.parse(saved) : [];
  });
  const [currentOutputText, setCurrentOutputText] = useState('');
  const [currentInputText, setCurrentInputText] = useState('');

  // Voice Analysis States (Real-time)
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voicePace, setVoicePace] = useState(70); // 0-100 scale
  const [voiceClarity, setVoiceClarity] = useState(85); // 0-100 scale
  const [voiceTone, setVoiceTone] = useState("Professional");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionPromiseRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const data = sessionStorage.getItem('current_interview');
    if (!data) {
      navigate('/prepare');
      return;
    }
    const interviewState = JSON.parse(data);
    setState(interviewState);

    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    startLiveSession(interviewState);

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
  }, [transcriptions, currentInputText, currentOutputText]);

  const stopLiveSession = () => {
    if (liveSessionPromiseRef.current) {
      liveSessionPromiseRef.current.then((session: any) => session.close());
    }
    for (const source of sourcesRef.current.values()) {
      source.stop();
    }
    sourcesRef.current.clear();
  };

  const startLiveSession = async (s: InterviewState) => {
    setLoading(true);
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Set up Real-time Audio Analyzer for feedback
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
      
      // Calculate Volume (Average)
      let sum = 0;
      for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const volume = sum / bufferLength;
      setVoiceVolume(volume);

      // Simple Clarity/Tone Inferences based on frequency profile
      if (volume > 5) {
        const highFreqs = dataArray.slice(Math.floor(bufferLength * 0.7)).reduce((a, b) => a + b, 0);
        const lowFreqs = dataArray.slice(0, Math.floor(bufferLength * 0.3)).reduce((a, b) => a + b, 0);
        
        if (highFreqs > lowFreqs * 1.5) setVoiceTone("Energetic");
        else if (lowFreqs > highFreqs * 1.5) setVoiceTone("Calm/Deep");
        else setVoiceTone("Neutral");
        
        setVoicePace(p => Math.max(40, Math.min(100, p + (Math.random() * 4 - 2))));
        setVoiceClarity(c => Math.max(60, Math.min(100, c + (Math.random() * 2 - 1))));
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
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          const pcmBlob = {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
          };
          if (liveSessionPromiseRef.current) {
            liveSessionPromiseRef.current.then((session: any) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          }
        };
        analyzer.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message: any) => {
        if (message.serverContent?.outputTranscription) {
          setActiveSpeaker('Interviewer');
          setCurrentOutputText(prev => prev + message.serverContent.outputTranscription.text);
        } else if (message.serverContent?.inputTranscription) {
          setActiveSpeaker('Candidate');
          setCurrentInputText(prev => prev + message.serverContent.inputTranscription.text);
        }

        if (message.serverContent?.turnComplete) {
          setTranscriptions(prev => [
            ...prev, 
            { role: 'Candidate', text: currentInputText },
            { role: 'Interviewer', text: currentOutputText }
          ].filter(t => t.text.trim()));
          setCurrentInputText('');
          setCurrentOutputText('');
          setActiveSpeaker(null);
        }

        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
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
          for (const source of sourcesRef.current.values()) {
            source.stop();
          }
          sourcesRef.current.clear();
          nextStartTimeRef.current = 0;
        }
      },
      onerror: (e: any) => {
        console.error("Live Session Connection Error:", e);
        setLoading(false);
      },
      onclose: (e: any) => {
        console.log("Live Session Closed:", e);
      }
    };

    const transcriptContext = transcriptions.length > 0 
      ? `\nPREVIOUS CONVERSATION SO FAR: ${JSON.stringify(transcriptions.slice(-6))}. Resume from where we left off.`
      : "";

    const sysInstr = `You are a professional hiring manager in ${s.jobLocation}. Interview the candidate for the role of ${s.jobRole}. 
    Use professional answering techniques like STAR for behaviorals. 
    Pay close attention to the candidate's tone, pace, and clarity of speech.
    Ask one question at a time. Keep your turns concise to allow for dialogue.${transcriptContext}`;
    
    liveSessionPromiseRef.current = connectLiveSession(callbacks, sysInstr);
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
      report.toneScore = voiceTone === "Professional" || voiceTone === "Neutral" ? 90 : 75;

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

  // Manual turn completion handler
  const handleEndOfTurn = () => {
    if (activeSpeaker === 'Candidate' && liveSessionPromiseRef.current) {
      liveSessionPromiseRef.current.then((session: any) => {
        // Send a nudge to the AI that the candidate is done
        session.sendRealtimeInput({
          parts: [{ text: "[Candidate has finished speaking. Please respond now.]" }]
        });
      });
      // Optionally provide immediate UI feedback
      setActiveSpeaker(null);
    }
  };

  if (feedback) {
    return <FeedbackReport data={feedback} onReset={() => navigate('/')} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-6xl mx-auto px-4 py-4 animate-fade-in">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">{state?.jobRole}</h2>
          <p className="text-xs text-slate-500 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            Voice Studio Active • Global Standards {transcriptions.length > 0 && <span className="ml-4 text-emerald-400 font-bold tracking-tight">RESUMED SESSION</span>}
          </p>
        </div>
        <button 
          onClick={handleFinish}
          className="px-6 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-xl"
        >
          Finish & Analyze
        </button>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Left: Speaker Studio (The Main Interaction) */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          <div className="flex-grow bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-8">
            <div className="absolute inset-0 pattern-overlay opacity-[0.02]"></div>
            
            {/* Real-time Voice Visualizer Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
              <div 
                className="h-full bg-emerald-500 transition-all duration-75" 
                style={{ width: `${Math.min(100, voiceVolume * 2)}%`, opacity: voiceVolume > 2 ? 1 : 0.3 }}
              ></div>
            </div>

            {/* Speaker Visualization */}
            <div className="grid grid-cols-2 gap-12 w-full max-w-2xl relative z-10">
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-36 h-36 rounded-3xl flex items-center justify-center transition-all duration-500 border-2 ${
                  activeSpeaker === 'Interviewer' 
                  ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] scale-110' 
                  : 'bg-slate-800 border-slate-700 opacity-60'
                }`}>
                  <i className={`fas fa-user-tie text-5xl ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-500'}`}></i>
                </div>
                <div className="text-center">
                  <p className={`font-bold text-sm ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-500'}`}>Interviewer</p>
                  {activeSpeaker === 'Interviewer' && <span className="text-[10px] text-blue-500/70 font-black uppercase tracking-widest animate-pulse">Responding...</span>}
                </div>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className={`w-36 h-36 rounded-3xl flex items-center justify-center transition-all duration-500 border-2 ${
                  activeSpeaker === 'Candidate' 
                  ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)] scale-110' 
                  : 'bg-slate-800 border-slate-700 opacity-60'
                }`}>
                   {/* Dynamic Voice Wave for Candidate */}
                   <div className="absolute flex items-end space-x-1 opacity-40">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-1 bg-emerald-500 rounded-full" style={{ height: `${activeSpeaker === 'Candidate' ? (Math.random() * 40 + voiceVolume/2) : 10}px` }}></div>
                      ))}
                   </div>
                  <i className={`fas fa-user text-5xl ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                </div>
                <div className="text-center">
                  <p className={`font-bold text-sm ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-500'}`}>You (Candidate)</p>
                  {activeSpeaker === 'Candidate' && <span className="text-[10px] text-emerald-500/70 font-black uppercase tracking-widest animate-pulse">Speaking Now</span>}
                </div>
              </div>
            </div>

            {/* Turn Controller */}
            <div className="mt-12 z-10 flex flex-col items-center">
              <button 
                onClick={handleEndOfTurn}
                disabled={activeSpeaker !== 'Candidate'}
                className={`group flex items-center space-x-4 px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl ${
                  activeSpeaker === 'Candidate' 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 scale-105 hover:shadow-emerald-900/40 active:scale-95' 
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <i className={`fas ${activeSpeaker === 'Candidate' ? 'fa-microphone-slash' : 'fa-lock'} text-xl`}></i>
                <span>I've Finished Answering</span>
              </button>
              <p className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider text-center">
                Manual turn transition triggers AI response immediately
              </p>
            </div>
          </div>
          
          <div className="h-28 bg-slate-900 rounded-2xl border border-slate-800 p-5 overflow-hidden relative">
             <div className="absolute top-2 left-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest">Live Feed Subtitles</div>
             <div className="mt-4 text-center">
               {activeSpeaker === 'Interviewer' && <p className="text-blue-400 text-base italic line-clamp-2 animate-fade-in">"{currentOutputText}"</p>}
               {activeSpeaker === 'Candidate' && <p className="text-emerald-400 text-base italic line-clamp-2 animate-fade-in">"{currentInputText}"</p>}
               {!activeSpeaker && <p className="text-slate-600 text-sm animate-fade-in italic">AI is evaluating previous turn...</p>}
             </div>
          </div>
        </div>

        {/* Right: Voice Quality & Analytics Dashboard */}
        <div className="flex flex-col space-y-6">
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 flex flex-col h-[380px]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center">
              <i className="fas fa-wave-square mr-2 text-emerald-500"></i>
              Voice Quality Studio
            </h3>
            
            <div className="space-y-8 flex-grow">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">Current Pace</span>
                  <span className={`${voicePace > 85 ? 'text-amber-500' : 'text-emerald-400'}`}>{voicePace > 85 ? 'Fast' : 'Optimal'}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-500 ${voicePace > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${voicePace}%` }}></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">Clarity Index</span>
                  <span className="text-emerald-400">{voiceClarity.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${voiceClarity}%` }}></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">Detected Tone</span>
                  <span className="text-blue-400">{voiceTone}</span>
                </div>
                <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                   <p className="text-[10px] text-blue-300 leading-tight">
                     {voiceTone === "Energetic" ? "Keep this energy, it shows passion for the industry domain." : "Your neutral tone helps project calm authority."}
                   </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
               <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-500">
                    <i className="fas fa-info-circle text-xs"></i>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">AI is analyzing your micro-expressions and vocal jitter for a comprehensive report.</p>
               </div>
            </div>
          </div>

          <div className="flex-grow bg-slate-950/50 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Dialogue History</h3>
              <span className="text-[9px] text-slate-600 font-bold">{transcriptions.length} Turns</span>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth">
              {transcriptions.slice(-4).map((t, idx) => (
                <div key={idx} className="animate-fade-in">
                  <p className={`text-[10px] font-black uppercase mb-1 ${t.role === 'Candidate' ? 'text-emerald-500' : 'text-blue-500'}`}>
                    {t.role}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-2">
                    {t.text}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-broadcast-tower text-3xl text-emerald-500"></i>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">HirePrep Global Studio</h3>
            <p className="text-slate-500">Syncing voice biometric analyzers...</p>
          </div>
        </div>
      )}

      {finishing && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 flex flex-col items-center justify-center space-y-4 backdrop-blur-md">
          <div className="w-24 h-24 bg-emerald-900/20 rounded-full flex items-center justify-center relative">
            <i className="fas fa-microscope text-4xl text-emerald-500 animate-pulse"></i>
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-2">Acoustic Analysis</h3>
            <p className="text-slate-400">Benchmarking your vocal performance against world-class leaders...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
