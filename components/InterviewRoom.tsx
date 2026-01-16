
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
  const [voicePace, setVoicePace] = useState(70); 
  const [voiceClarity, setVoiceClarity] = useState(85); 
  const [voiceTone, setVoiceTone] = useState("Professional");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveMessagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    liveMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentInputText, currentOutputText]);

  const stopLiveSession = () => {
    if (liveSessionPromiseRef.current) {
      liveSessionPromiseRef.current.then((session: any) => session.close()).catch(() => {});
    }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
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

      const transcriptStr = transcriptions.length > 0 
        ? JSON.stringify(transcriptions.slice(-6))
        : "None";

      const sysInstr = `You are a professional hiring manager in ${s.jobLocation}. Interview the candidate for ${s.jobRole}. 
      Use STAR for behavioral questions. 
      Dialogue History: ${transcriptStr}.
      Ask one concise question at a time.`;
      
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
      report.toneScore = (voiceTone === "Professional" || voiceTone === "Neutral") ? 90 : 75;
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
          parts: [{ text: "[Candidate has finished speaking. Please respond now.]" }]
        });
      }).catch(() => {});
      setActiveSpeaker(null);
    }
  };

  if (feedback) {
    return <FeedbackReport data={feedback} onReset={() => navigate('/')} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-6xl mx-auto px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">{state?.jobRole}</h2>
          <p className="text-xs text-slate-500 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            Voice Studio Active • Global Standards
          </p>
        </div>
        <button onClick={handleFinish} className="px-6 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-xl">
          Finish & Analyze
        </button>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        <div className="lg:col-span-3 flex flex-col space-y-6 overflow-hidden">
          <div className="flex-grow bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-8 min-h-[400px]">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
              <div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${Math.min(100, voiceVolume * 2)}%`, opacity: voiceVolume > 2 ? 1 : 0.3 }}></div>
            </div>

            <div className="grid grid-cols-2 gap-12 w-full max-w-2xl relative z-10">
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-36 h-36 rounded-3xl flex items-center justify-center transition-all duration-500 border-2 ${activeSpeaker === 'Interviewer' ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] scale-110' : 'bg-slate-800 border-slate-700 opacity-60'}`}>
                  <i className={`fas fa-user-tie text-5xl ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-500'}`}></i>
                </div>
                <div className="text-center">
                  <p className={`font-bold text-sm ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-500'}`}>Interviewer</p>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className={`w-36 h-36 rounded-3xl flex items-center justify-center transition-all duration-500 border-2 ${activeSpeaker === 'Candidate' ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)] scale-110' : 'bg-slate-800 border-slate-700 opacity-60'}`}>
                   <div className="absolute flex items-end space-x-1 opacity-40">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-1 bg-emerald-500 rounded-full" style={{ height: `${activeSpeaker === 'Candidate' ? (Math.random() * 40 + voiceVolume/2) : 10}px` }}></div>
                      ))}
                   </div>
                  <i className={`fas fa-user text-5xl ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                </div>
                <div className="text-center">
                  <p className={`font-bold text-sm ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-500'}`}>You (Candidate)</p>
                </div>
              </div>
            </div>

            <div className="mt-12 z-10">
              <button onClick={handleEndOfTurn} disabled={activeSpeaker !== 'Candidate'} className={`group flex items-center space-x-4 px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl ${activeSpeaker === 'Candidate' ? 'bg-emerald-600 text-white hover:bg-emerald-500 scale-105' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}>
                <i className={`fas ${activeSpeaker === 'Candidate' ? 'fa-microphone-slash' : 'fa-lock'} text-xl`}></i>
                <span>I've Finished Answering</span>
              </button>
            </div>
          </div>
          
          <div className="h-44 bg-slate-900 rounded-3xl border border-slate-800 p-6 overflow-hidden relative flex flex-col shadow-inner">
             <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>Transcription Stream</span>
             </div>
             <div className="flex-grow overflow-y-auto pr-2 space-y-4 font-medium text-lg leading-relaxed italic">
               {(currentInputText || currentOutputText) ? (
                 <div className="space-y-4">
                   {currentInputText && <p className="text-emerald-400">"{currentInputText}"</p>}
                   {currentOutputText && <p className="text-blue-400">"{currentOutputText}"</p>}
                 </div>
               ) : (
                 <div className="h-full flex items-center justify-center opacity-30 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Captions will appear here as you speak</p>
                 </div>
               )}
               <div ref={liveMessagesEndRef} />
             </div>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 flex flex-col h-[380px]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Voice Quality</h3>
            <div className="space-y-8 flex-grow">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">PACE</span><span className="text-emerald-400">{voicePace.toFixed(0)}</span></div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${voicePace}%` }}></div></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">CLARITY</span><span className="text-emerald-400">{voiceClarity.toFixed(0)}%</span></div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${voiceClarity}%` }}></div></div>
              </div>
              <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                 <p className="text-[10px] text-blue-300">Tone: {voiceTone}</p>
              </div>
            </div>
          </div>

          <div className="flex-grow bg-slate-950/50 rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800"><h3 className="font-bold text-[10px] uppercase text-slate-500">History</h3></div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {transcriptions.slice(-3).map((t, idx) => (
                <div key={idx} className="animate-fade-in">
                  <p className={`text-[10px] font-black uppercase ${t.role === 'Candidate' ? 'text-emerald-500' : 'text-blue-500'}`}>{t.role}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic">{t.text}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center space-y-4">
          <i className="fas fa-broadcast-tower text-3xl text-emerald-500 animate-pulse"></i>
          <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Initializing Studio...</p>
        </div>
      )}

      {finishing && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 flex flex-col items-center justify-center backdrop-blur-md">
          <i className="fas fa-microscope text-4xl text-emerald-500 animate-spin mb-4"></i>
          <p className="text-white font-bold uppercase tracking-widest">Generating Dossier...</p>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
