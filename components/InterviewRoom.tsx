
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

const ACTIVE_SESSION_KEY = 'hireprep_active_session';
const FILLER_WORDS = ['um', 'uh', 'like', 'so', 'actually', 'basically', 'kind of'];
const MAX_SESSION_DURATION = 1800; // 30 minutes in seconds
const WARNING_THRESHOLD = 300; // Warning when 5 minutes remain

const InterviewRoom: React.FC<{ user: any, onFinish?: (result: InterviewResult) => void }> = ({ user, onFinish }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<InterviewState | null>(null);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  
  // Timer State
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Voice Session State
  const [activeSpeaker, setActiveSpeaker] = useState<'Interviewer' | 'Candidate' | null>(null);
  const [transcriptions, setTranscriptions] = useState<{role: string, text: string, timestamp: number}[]>(() => {
    const saved = localStorage.getItem('active_interview_transcript');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentOutputText, setCurrentOutputText] = useState('');
  const [currentInputText, setCurrentInputText] = useState('');

  // LinkedIn-style Voice Analysis States
  const [fillerCount, setFillerCount] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState<string[]>([]);
  const [wpm, setWpm] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voiceClarity, setVoiceClarity] = useState(90);
  const [clarityWarning, setClarityWarning] = useState<string | null>(null);
  
  // Recording State
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionPromiseRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>(0);

  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mixedOutputRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const currentOutputTextRef = useRef('');
  const currentInputTextRef = useRef('');
  const turnStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const data = localStorage.getItem(ACTIVE_SESSION_KEY) || sessionStorage.getItem('current_interview');
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

  // Session Timer
  useEffect(() => {
    let interval: any;
    if (isReady && !finishing) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReady, finishing]);

  // Real-time Filler Word & WPM Calculation
  useEffect(() => {
    if (currentInputText) {
      const words = currentInputText.toLowerCase().split(/\s+/);
      const fillers = words.filter(w => FILLER_WORDS.includes(w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")));
      setDetectedFillers(prev => Array.from(new Set([...prev, ...fillers])));
      
      if (turnStartTimeRef.current) {
        const durationSeconds = (Date.now() - turnStartTimeRef.current) / 1000;
        const currentWpm = Math.round((words.length / durationSeconds) * 60);
        if (currentWpm > 0 && currentWpm < 300) setWpm(currentWpm);
      }
    }
  }, [currentInputText]);

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
    
    // Stop Recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleExit = () => {
    if (window.confirm("Quit session? Your progress is saved.")) {
      stopLiveSession();
      navigate('/');
    }
  };

  const initializeAudioAndStart = async () => {
    if (!state || loading) return;
    setLoading(true);
    setError(null);

    const firstName = user?.name ? user.name.split(' ')[0] : 'Candidate';

    try {
      // Single AudioContext Architecture for Mobile Stability
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      // iOS Audio Unlock Strategy:
      // Play a tiny silent buffer immediately to unlock the AudioContext on iOS/Safari.
      const silentBuffer = ctx.createBuffer(1, 1, 22050);
      const silentSource = ctx.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(ctx.destination);
      silentSource.start(0);

      // Ensure context is running
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      outputAudioContextRef.current = ctx;

      // --- RECORDER SETUP: Create a destination node to mix mic and AI audio ---
      const mixedOutput = ctx.createMediaStreamDestination();
      mixedOutputRef.current = mixedOutput;
      
      const recorder = new MediaRecorder(mixedOutput.stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      // -----------------------------------------------------------------------

      // Mobile Audio Constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Hint to browser, though often ignored on mobile
        } 
      });
      
      const sourceNode = ctx.createMediaStreamSource(stream);

      // --- Advanced Audio Processing Chain ---
      
      // 1. High-Pass Filter (Noise Reduction)
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 85; 
      noiseFilter.Q.value = 0.707;

      // 2. Dynamics Compressor (Adaptive Gain Control)
      const gainControl = ctx.createDynamicsCompressor();
      gainControl.threshold.value = -24; 
      gainControl.knee.value = 30;       
      gainControl.ratio.value = 12;      
      gainControl.attack.value = 0.003;  
      gainControl.release.value = 0.25;  

      // Connect the Graph: Source -> Filter -> Compressor
      sourceNode.connect(noiseFilter);
      noiseFilter.connect(gainControl);

      // ROUTING FOR RECORDING: Connect Mic input to the mixed recording destination
      sourceNode.connect(mixedOutput); 
      
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 256;
      // Connect processed audio to analyzer for accurate visualizer
      gainControl.connect(analyzer);
      analyzerRef.current = analyzer;

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAnalysis = () => {
        if (!analyzerRef.current) return;
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const volume = sum / bufferLength; // Raw average volume (0-255)
        
        // Normalize for Display (0-100)
        const displayVol = Math.min(100, (volume / 255) * 400); 
        setVoiceVolume(displayVol);

        // Clarity Filter Logic
        let targetClarity = 100;
        let warning = null;
        
        // Check signal quality if there is significant input
        if (displayVol > 5) {
          if (displayVol < 15) {
            targetClarity = 60;
            warning = "Speak clearer or move closer";
          } else if (displayVol > 95) {
            targetClarity = 70;
            warning = "Audio clipping, move back";
          } else {
            targetClarity = 100;
          }
        }

        // Smooth Clarity Score Update
        setVoiceClarity(prev => prev * 0.9 + targetClarity * 0.1);

        // Update Warning (Hysteresis-like check to avoid flicker)
        if (displayVol > 5 && targetClarity < 80) {
           setClarityWarning(warning);
        } else {
           setClarityWarning(null);
        }

        requestRef.current = requestAnimationFrame(updateAnalysis);
      };
      updateAnalysis();

      const callbacks = {
        onopen: () => {
          setLoading(false);
          setIsReady(true);
          // 4096 buffer size offers a balance between latency and performance on mobile
          const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e: any) => {
            const inputData = e.inputBuffer.getChannelData(0);
            // Downsampling logic for API (16kHz)
            const pcmBlob = {
              data: encode(new Uint8Array(convertFloat32ToInt16(inputData).buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            
            if (liveSessionPromiseRef.current) {
              liveSessionPromiseRef.current.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            }
          };
          
          // Connect processed audio to script processor
          gainControl.connect(scriptProcessor);
          scriptProcessor.connect(ctx.destination); 
        },
        onmessage: async (message: any) => {
          if (message.serverContent?.outputTranscription) {
            setActiveSpeaker('Interviewer');
            const text = message.serverContent.outputTranscription.text;
            currentOutputTextRef.current += text;
            setCurrentOutputText(currentOutputTextRef.current);
          } else if (message.serverContent?.inputTranscription) {
            if (!turnStartTimeRef.current) turnStartTimeRef.current = Date.now();
            setActiveSpeaker('Candidate');
            const text = message.serverContent.inputTranscription.text;
            currentInputTextRef.current += text;
            setCurrentInputText(currentInputTextRef.current);
          }

          if (message.serverContent?.turnComplete) {
            const candText = currentInputTextRef.current;
            const intText = currentOutputTextRef.current;
            
            const words = candText.toLowerCase().split(/\s+/);
            const fillersInTurn = words.filter(w => FILLER_WORDS.includes(w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")));
            setFillerCount(prev => prev + fillersInTurn.length);

            setTranscriptions(prev => [
              ...prev, 
              { role: 'Candidate', text: candText, timestamp: Date.now() },
              { role: 'Interviewer', text: intText, timestamp: Date.now() }
            ].filter(t => t.text.trim()));

            currentInputTextRef.current = '';
            currentOutputTextRef.current = '';
            setCurrentInputText('');
            setCurrentOutputText('');
            setActiveSpeaker(null);
            turnStartTimeRef.current = null;
          }

          if (message.serverContent?.modelTurn?.parts && outputAudioContextRef.current) {
             for (const part of message.serverContent.modelTurn.parts) {
               if (part.inlineData?.data) {
                  const audioData = part.inlineData.data;
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                  
                  const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
                  const source = outputAudioContextRef.current.createBufferSource();
                  source.buffer = audioBuffer;
                  
                  // Connect AI Audio to Speakers
                  source.connect(outputAudioContextRef.current.destination);
                  
                  // ROUTING FOR RECORDING: Also connect AI Audio to the mixed recording destination
                  if (mixedOutputRef.current) {
                    source.connect(mixedOutputRef.current);
                  }

                  source.addEventListener('ended', () => sourcesRef.current.delete(source));
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
               }
             }
          }
        },
        onerror: (e: any) => {
          setError("Connection failed. Please refresh.");
          setLoading(false);
          setIsReady(false);
        }
      };

      const sysInstr = `Persona: You are a world-class senior hiring manager with an incredibly smooth, calm, and reassuring voice. You are here to coach the candidate to success. You speak clearly and warmly. 
      IMPORTANT: The candidate's name is ${firstName}. Use their first name naturally during the conversation (e.g., "Hello ${firstName}", "Great point, ${firstName}") to create a personal, professional, and reassuring atmosphere.
      Market context: ${state.region}. Role: ${state.jobRole}.
      Rigor: Even though your voice is kind, your questions are insightful and high-level.
      Interactions: Wait for the candidate to finish their turn. If they say '[The candidate has finished]', acknowledge it warmly and move to the next question.`;
      
      liveSessionPromiseRef.current = connectLiveSession(callbacks, sysInstr);
    } catch (err: any) {
      console.error(err);
      setError("Microphone access required. Ensure you are on a secure (HTTPS) connection.");
      setLoading(false);
    }
  };

  const convertFloat32ToInt16 = (buffer: Float32Array) => {
    let l = buffer.length;
    let buf = new Int16Array(l);
    while (l--) {
      buf[l] = Math.min(1, Math.max(-1, buffer[l])) * 0x7FFF;
    }
    return buf;
  };

  const handleFinish = async () => {
    if (!state) return;
    setFinishing(true);
    stopLiveSession(); // This triggers recorder stop and sets recordedAudioUrl
    
    try {
      const history = transcriptions.map(t => ({ role: t.role === 'Candidate' ? 'user' : 'model', text: t.text }));
      const report = await generateDetailedFeedback(state, history);
      report.paceScore = wpm > 160 || wpm < 110 ? 70 : 95; 
      report.clarityScore = voiceClarity;
      report.toneScore = 90;
      setFeedback(report);
      localStorage.removeItem('active_interview_transcript');
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      if (onFinish) {
        onFinish({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          role: state.jobRole,
          score: report.score,
          feedback: report,
          transcript: history
        });
      }
    } catch (err) {
      setError("Analysis failed. Try again.");
    } finally {
      setFinishing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingTime = MAX_SESSION_DURATION - elapsedTime;
  const isWarning = remainingTime <= WARNING_THRESHOLD && remainingTime > 0;
  const isOvertime = remainingTime <= 0;

  if (feedback) {
    return (
      <FeedbackReport 
        data={feedback} 
        role={state?.jobRole} 
        onReset={() => navigate('/')} 
        recordingUrl={recordedAudioUrl}
        transcript={transcriptions}
      />
    );
  }

  if (!isReady && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-600/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-10 shadow-xl border border-emerald-500/20">
          <i className="fas fa-microphone-lines text-4xl"></i>
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Studio Initialization</h2>
        <p className="text-slate-400 max-w-sm mb-12 leading-relaxed text-sm">
          Connect to your private, high-fidelity studio. The AI Hiring Manager is ready to provide real-time coaching.
        </p>
        {error && <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">{error}</div>}
        <div className="flex flex-col space-y-4 w-full max-w-xs">
          <button 
            onClick={initializeAudioAndStart} 
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-50 shadow-2xl shadow-emerald-900/40 active:scale-95 transition-all"
          >
            Enter Studio
          </button>
          <button onClick={() => navigate('/')} className="w-full py-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white">Cancel</button>
        </div>
      </div>
    );
  }

  if (loading || finishing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="relative mb-10">
          <div className="w-20 h-20 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">{finishing ? 'Generating Critical Insights' : 'Calibrating AI Persona'}</h2>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">Processing Neural Streams...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 md:px-6 animate-fade-in relative pb-10">
      
      {/* Session Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-slate-900/60 backdrop-blur-xl p-5 rounded-[2.5rem] border border-slate-800/50 shadow-2xl gap-4 md:gap-0">
        <div className="flex items-center space-x-5 w-full md:w-auto justify-between md:justify-start">
          <button onClick={handleExit} className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-slate-400 transition-all">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="md:block text-right md:text-left">
            <h2 className="text-sm font-black text-white">{state?.jobRole}</h2>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Recording Active</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          
          {/* Timer - Subtle, changes color on warning/overtime */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-all ${
              isOvertime ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 
              isWarning ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
              'bg-slate-800/50 border-slate-700/50 text-slate-400'
          } md:mr-2`}>
              <i className="fas fa-clock text-[10px]"></i>
              <span className="text-[10px] md:text-[11px] font-mono font-bold">{formatTime(elapsedTime)}</span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 mr-4">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Studio Link Active</span>
          </div>
          <button 
            onClick={handleFinish} 
            className="w-full md:w-auto px-8 py-3.5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 shadow-xl active:scale-95 transition-all"
          >
            Finish & Analyze
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 lg:overflow-hidden overflow-y-auto pb-20 lg:pb-0">
        
        {/* Visualizer Area */}
        <div className="lg:col-span-8 flex flex-col space-y-8 min-h-[500px] lg:h-full">
          <div className="flex-grow bg-slate-900 rounded-[3.5rem] border border-slate-800/50 relative overflow-hidden flex flex-col items-center justify-center p-8 shadow-inner">
            <div className="absolute inset-0 pattern-overlay opacity-[0.05]"></div>
            
            {/* Visualizer Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
               <div className={`w-64 h-64 md:w-96 md:h-96 rounded-full blur-[80px] md:blur-[100px] transition-all duration-1000 ${activeSpeaker === 'Interviewer' ? 'bg-blue-600 scale-110' : activeSpeaker === 'Candidate' ? 'bg-emerald-600 scale-125' : 'bg-slate-800 scale-100'}`}></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-32 w-full max-w-3xl relative z-10">
              <div className="flex flex-col items-center space-y-4 md:space-y-6">
                <div className={`w-32 h-32 md:w-44 md:h-44 rounded-[3rem] flex items-center justify-center transition-all duration-1000 border-4 transform ${activeSpeaker === 'Interviewer' ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.25)] scale-110' : 'bg-slate-950 border-slate-800/50 opacity-30'}`}>
                  <i className={`fas fa-user-tie text-4xl md:text-6xl ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-700'}`}></i>
                </div>
                <div className="text-center">
                   <p className={`font-black text-[10px] uppercase tracking-[0.2em] mb-1 ${activeSpeaker === 'Interviewer' ? 'text-blue-400' : 'text-slate-600'}`}>Senior Recruiter</p>
                   {activeSpeaker === 'Interviewer' && <p className="text-[10px] text-blue-300/60 font-medium">Speaking...</p>}
                </div>
              </div>

              <div className="flex flex-col items-center space-y-4 md:space-y-6 relative">
                {/* Clarity Warning Tooltip */}
                {clarityWarning && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap animate-bounce shadow-lg z-50">
                     <i className="fas fa-exclamation-triangle mr-2"></i>
                     {clarityWarning}
                     <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-amber-500/90"></div>
                  </div>
                )}
                
                <div className={`w-32 h-32 md:w-44 md:h-44 rounded-[3rem] flex items-center justify-center transition-all duration-1000 border-4 transform ${activeSpeaker === 'Candidate' ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.25)] scale-110' : 'bg-slate-950 border-slate-800/50 opacity-30'}`}>
                   <div className="relative">
                      <i className={`fas fa-user text-4xl md:text-6xl ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-700'}`}></i>
                      {voiceVolume > 5 && (
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-end space-x-1.5 h-12">
                          {[1,2,3,4,5,6].map(i => (<div key={i} className="w-1.5 bg-emerald-500 rounded-full animate-bounce" style={{height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.05}s`}}></div>))}
                        </div>
                      )}
                   </div>
                </div>
                <div className="text-center">
                   <p className={`font-black text-[10px] uppercase tracking-[0.2em] mb-1 ${activeSpeaker === 'Candidate' ? 'text-emerald-400' : 'text-slate-600'}`}>Candidate (You)</p>
                   {activeSpeaker === 'Candidate' && <p className="text-[10px] text-emerald-300/60 font-medium">Recording Insights...</p>}
                </div>
              </div>
            </div>

            <div className="absolute bottom-12 left-6 right-6 md:left-10 md:right-10 text-center max-w-4xl mx-auto">
               <p className="text-slate-100 text-base md:text-2xl font-medium leading-relaxed drop-shadow-2xl">
                 {currentOutputText || currentInputText || 'The studio is quiet. Begin speaking whenever you are ready...'}
               </p>
            </div>
          </div>
        </div>

        {/* LinkedIn-style Telemetry Panel */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-slate-900 rounded-[3rem] border border-slate-800/50 flex flex-col overflow-hidden h-full shadow-2xl">
             <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-950/20">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live AI Metrics</h3>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
             </div>
             
             <div className="p-8 space-y-10 overflow-y-auto">
                {/* Mic Input Level - Visualizer */}
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        Microphone Input <span className="text-emerald-500 text-[9px] ml-1 opacity-70">(HD Enhanced)</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${voiceVolume > 5 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                        <span className="text-[10px] font-bold text-slate-400">{voiceVolume > 5 ? 'Active' : 'Silent'}</span>
                      </div>
                   </div>
                   <div className="flex items-end justify-between space-x-0.5 h-10 bg-slate-950/50 rounded-xl p-2 border border-slate-800/50">
                      {[...Array(30)].map((_, i) => {
                         const isActive = i < (voiceVolume / 100) * 30; 
                         return (
                           <div 
                             key={i} 
                             className={`w-full rounded-sm transition-all duration-75 ${
                               isActive 
                                 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                                 : 'bg-slate-800/50'
                             }`}
                             style={{ 
                               height: isActive ? `${30 + Math.random() * 70}%` : '15%',
                               opacity: isActive ? 1 : 0.3
                             }}
                           ></div>
                         );
                      })}
                   </div>
                </div>

                {/* WPM Metric */}
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pace (WPM)</span>
                      <span className={`text-sm font-black ${wpm > 160 ? 'text-amber-500' : wpm < 110 ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {wpm} <span className="text-[10px] opacity-60">Avg</span>
                      </span>
                   </div>
                   <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-emerald-500/10 border-x-2 border-emerald-500/20 left-[40%] right-[30%]"></div>
                      <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(100, (wpm / 200) * 100)}%` }}></div>
                   </div>
                   <p className="text-[9px] text-slate-600 font-bold uppercase">Goal: 130-150 WPM (Professional standard)</p>
                </div>

                {/* Filler Word Tracker */}
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Filler Words</span>
                      <span className={`text-sm font-black ${fillerCount > 5 ? 'text-red-400' : 'text-slate-300'}`}>{fillerCount}</span>
                   </div>
                   
                   {/* Severity Bar */}
                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div className={`h-full transition-all duration-500 ${fillerCount === 0 ? 'bg-emerald-500' : fillerCount < 5 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (fillerCount / 10) * 100)}%` }}></div>
                   </div>

                   <div className="flex flex-wrap gap-2">
                      {detectedFillers.length > 0 ? detectedFillers.map(f => (
                        <span key={f} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 uppercase flex items-center space-x-1">
                            <i className="fas fa-exclamation-circle text-amber-500/50 text-[9px]"></i>
                            <span>{f}</span>
                        </span>
                      )) : <p className="text-[10px] text-slate-700 italic">No fillers detected yet. Great job!</p>}
                   </div>
                </div>

                {/* Vocal Clarity */}
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Clarity & Confidence</span>
                      <span className="text-sm font-black text-blue-400">{Math.round(voiceClarity)}%</span>
                   </div>
                   <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-700 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${voiceClarity}%` }}></div>
                   </div>
                </div>

                {/* Live Tips */}
                <div className="pt-6 border-t border-slate-800/50">
                   <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Coach's Live Notes</h4>
                   <div className="bg-slate-950/40 p-5 rounded-3xl border border-slate-800/50 space-y-4">
                      {wpm > 160 ? (
                        <div className="flex items-start space-x-3">
                           <i className="fas fa-gauge-high text-amber-500 mt-1"></i>
                           <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-amber-400 font-bold">Fast Pace:</span> You're speaking a bit quickly. Take a breath between sentences.</p>
                        </div>
                      ) : fillerCount > 3 ? (
                        <div className="flex items-start space-x-3">
                           <i className="fas fa-triangle-exclamation text-blue-400 mt-1"></i>
                           <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-blue-400 font-bold">Fillers Used:</span> Try to pause silently instead of using "um" or "like".</p>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-3">
                           <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                           <p className="text-[11px] text-slate-400 leading-relaxed">You're doing great. Your tone is steady and professional.</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
             
             <div className="mt-auto p-6 bg-slate-950/50 border-t border-slate-800/50">
                <button 
                  onClick={() => {
                    if (liveSessionPromiseRef.current) {
                      liveSessionPromiseRef.current.then((session: any) => {
                        session.sendRealtimeInput({ text: "[The candidate has finished their response. Please proceed with your next question.]" });
                      });
                    }
                  }}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Finished Speaking
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
