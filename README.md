# HirePrep AI - International Interview Mastery

HirePrep AI is a world-class, AI-powered interview preparation platform designed to help candidates (specifically tailored for the African talent pool) master international job interviews. It leverages the latest Google Gemini 2.5 Live API for real-time voice interactions and deep analysis.

## 🚀 Core Features

- **Live Interview Studio**: Real-time, low-latency voice conversation with an AI Interviewer using Gemini 2.5 Flash Native Audio.
- **Advanced Voice Analysis**: Core feature providing live feedback on vocal **Tone, Pace, and Clarity**.
- **CV & Job Context Analysis**: Analyzes your resume against specific job roles and locations to identify gaps and strengths.
- **"I've Finished Speaking" Button**: A manual signal to the AI for more natural conversational turn-taking.
- **Session Persistence**: Automatic state saving to `localStorage` allows users to resume interrupted interviews without losing progress.
- **Comprehensive Feedback Ecosystem**: Detailed performance reports featuring Radar charts, technical accuracy scores, and tactical optimization suggestions.
- **African Market Tailoring**: Specifically handles regional nuances while benchmarking against global industry standards.

## 🛠️ Technical Implementation

- **Gemini Live API**: Continuous streaming of audio/PCM data for human-like interaction.
- **Web Audio API**: Frequency analyzers used for real-time vocal visualization and metric tracking.
- **Persistence**: Hybrid use of `sessionStorage` (for active setup) and `localStorage` (for long-term transcript and state persistence).
- **Responsive UI**: Built with React, Tailwind CSS, and Framer-motion inspired animations.

## 🔑 Demo Credentials

To access the full Premium features of the platform instantly, use the following credentials on the login screen:

- **Email**: `admin@gmail.com`
- **Password**: `adminpass`

## 📜 Metadata

- **Microphone Permissions**: Required for the Interview Studio.
- **API Key**: Injected via `process.env.API_KEY`.
