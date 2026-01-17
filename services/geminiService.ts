
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { InterviewState, FeedbackData, Difficulty } from "../types";

export const analyzeJobContext = async (state: InterviewState): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    As a world-class Global Talent Acquisition Specialist specializing in the African tech and professional market, analyze the following data for a candidate applying to a role in ${state.region}:
    
    JOB ROLE: ${state.jobRole}
    INDUSTRY/DOMAIN: ${state.industry}
    JOB LOCATION: ${state.jobLocation}
    JOB DESCRIPTION: ${state.jobDescription}
    CANDIDATE CV: ${state.cvText}
    
    Provide a detailed analysis including:
    1. A list of skill gaps (matched, missing, or partial).
    2. 3 areas of major strength.
    3. Specific advice for interviewing in the ${state.region} market vs Global standards.
    4. Current market salary expectations or hiring trends if possible.

    Return the response in JSON format according to this schema:
    {
      "summary": "string",
      "strengths": ["string"],
      "skillGaps": [
        { "skill": "string", "status": "matched" | "missing" | "partial", "advice": "string" }
      ],
      "marketInsights": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            skillGaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["matched", "missing", "partial"] },
                  advice: { type: Type.STRING }
                },
                required: ["skill", "status", "advice"]
              }
            },
            marketInsights: { type: Type.STRING }
          },
          required: ["summary", "strengths", "skillGaps", "marketInsights"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      summary: "Analysis failed, but you're ready to start!",
      strengths: ["Resilience", "Global Outlook"],
      skillGaps: [],
      marketInsights: "Local market data currently unavailable."
    };
  }
};

export const generateNextQuestion = async (
  state: InterviewState, 
  history: {role: string, text: string}[],
  isFirst: boolean = false
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const difficultyPrompt = state.difficulty === Difficulty.HARD 
    ? "Ask complex, multi-layered scenario-based questions that test deep technical and strategic competence." 
    : state.difficulty === Difficulty.MEDIUM 
    ? "Ask professional standard competency and experience-based questions." 
    : "Ask straightforward introductory, interest, and core skills-based questions.";

  const regionPrompt = `Incorporate nuances of the ${state.region} market, mentioning relevant local challenges or opportunities where appropriate for ${state.industry}.`;

  const prompt = isFirst 
    ? `Start the professional interview for the role of ${state.jobRole} in the ${state.industry} industry, located in ${state.jobLocation}. 
       ${difficultyPrompt} ${regionPrompt}
       Tailor your questioning to international standards and professional expectations.
       Reference parts of their CV: ${state.cvText.substring(0, 500)}... if relevant.`
    : `Given the interview history so far: ${JSON.stringify(history.slice(-4))}. 
       Ask the next relevant follow-up or a new question for the ${state.jobRole} position. 
       Maintain high professional rigor.
       ${difficultyPrompt}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: `You are a Global Talent Acquisition Leader with deep expertise in the African professional landscape. 
      You are interviewing a high-potential candidate for a role in ${state.region}. You speak with clarity, authority, and professional warmth. 
      Incorporate international professional standards and industry-specific terminology for ${state.industry}.
      Do not provide feedback yet, only ask the next question.`
    }
  });

  return response.text || "Could you tell me more about your experience in this field?";
};

export const generateDetailedFeedback = async (
  state: InterviewState,
  history: {role: string, text: string}[]
): Promise<FeedbackData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `Analyze this professional interview transcript and provide a structured review in JSON format.
  
  CONTEXT:
  Role: ${state.jobRole}
  Industry: ${state.industry}
  Location: ${state.jobLocation}
  Region: ${state.region}
  Difficulty: ${state.difficulty}
  
  TRANSCRIPT:
  ${JSON.stringify(history)}
  
  Evaluate against global industry benchmarks, professional techniques (like STAR for behavioral answers), and technical accuracy for the ${state.industry} domain.
  Also factor in the ${state.region} market context.

  Return exactly this JSON structure:
  {
    "score": number (0-100),
    "strengths": string[],
    "weaknesses": string[],
    "suggestions": [
      { "text": "Actionable advice", "rationale": "Brief explanation" }
    ],
    "skillGaps": [],
    "marketInsights": "string",
    "technicalAccuracy": number,
    "communicationSkills": number,
    "confidence": number,
    "toneScore": number,
    "paceScore": number,
    "clarityScore": number
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["text", "rationale"]
            } 
          },
          marketInsights: { type: Type.STRING },
          technicalAccuracy: { type: Type.NUMBER },
          communicationSkills: { type: Type.NUMBER },
          confidence: { type: Type.NUMBER },
          toneScore: { type: Type.NUMBER },
          paceScore: { type: Type.NUMBER },
          clarityScore: { type: Type.NUMBER },
        },
        required: ["score", "strengths", "weaknesses", "suggestions", "technicalAccuracy", "communicationSkills", "confidence", "toneScore", "paceScore", "clarityScore"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response");
    const parsed = JSON.parse(text);
    return { ...parsed, skillGaps: [] }; // Fallback for skillGaps if missing from prompt logic
  } catch (e) {
    throw new Error("Failed to parse feedback.");
  }
};

/** AI Assistant Chat System */
export const createChatSession = () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'You are an AI Global Career Consultant with specific expertise in the African and emerging markets. You help professionals with career strategy, CV optimization, and international interview preparation. Be highly professional, globally aware, and concise.',
    }
  });
};

/** Audio Transcription Service */
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'audio/wav',
            data: base64Audio,
          },
        },
        { text: "Please transcribe this audio accurately." },
      ]
    },
  });
  return response.text || "";
};

/** Text-to-Speech Service */
export const speakText = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

/** LIVE API Utilities */
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const connectLiveSession = (callbacks: any, systemInstruction: string) => {
  const apiKey = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      inputAudioTranscription: {}, 
      outputAudioTranscription: {},
      systemInstruction,
    },
  });
};
