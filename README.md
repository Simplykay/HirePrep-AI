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

---

## 📋 Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)
- **Google Gemini API Key**: Get yours from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/HirePrep-AI.git
cd HirePrep-AI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your Google Gemini API key:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

> **⚠️ IMPORTANT**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

---

## 🚀 Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 🧪 Testing

### Run Tests

```bash
npm run test
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests Once (CI Mode)

```bash
npm run test:run
```

### Generate Coverage Report

```bash
npm run coverage
```

---

## 🎨 Code Quality

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### Code Formatting

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

### Type Checking

```bash
npm run type-check
```

---

## 🔑 Demo Credentials

To access the full Premium features of the platform instantly, use the following credentials on the login screen:

- **Email**: `admin@gmail.com`
- **Password**: `adminpass`

> **Note**: This is a demo authentication system. For production, implement proper authentication (Firebase, Supabase, or custom backend).

---

## 📁 Project Structure

```
HirePrep-AI/
├── components/          # React components
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── ErrorBoundary.tsx
│   ├── InterviewRoom.tsx
│   ├── LoadingSpinner.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useLocalStorage.ts
│   └── useGeminiChat.ts
├── services/           # API services
│   └── geminiService.ts
├── tests/              # Test files
│   ├── setup.ts
│   └── LoadingSpinner.test.tsx
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── .env.example        # Environment variables template
└── package.json        # Project dependencies
```

---

## 🌍 Deployment

### Deploy to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add `VITE_GEMINI_API_KEY` with your API key

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify

3. Set environment variable `VITE_GEMINI_API_KEY` in Netlify dashboard

---

## 🔒 Security Best Practices

- ✅ API keys are stored in environment variables (`.env`)
- ✅ `.env` file is excluded from version control
- ✅ TypeScript strict mode enabled for type safety
- ✅ Error boundaries implemented for graceful error handling
- ⚠️ **TODO**: Implement real authentication system (currently using demo auth)
- ⚠️ **TODO**: Add rate limiting for API calls
- ⚠️ **TODO**: Implement proper user session management

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 Metadata

- **Microphone Permissions**: Required for the Interview Studio.
- **API Key**: Configured via environment variables (`VITE_GEMINI_API_KEY`).
- **Browser Compatibility**: Modern browsers with Web Audio API support (Chrome, Firefox, Edge, Safari 14+)

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Troubleshooting

### API Key Issues

If you see errors related to API key:
1. Ensure `.env` file exists in the root directory
2. Verify `VITE_GEMINI_API_KEY` is set correctly
3. Restart the development server after changing `.env`

### TypeScript Errors

If you encounter TypeScript errors:
```bash
npm run type-check
```

### Build Errors

Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@hireprep.ai (placeholder)

---

**Built with ❤️ for African Talent**
