/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_GOOGLE_CLIENT_ID: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_ENV: string;
    readonly VITE_ENABLE_ANALYTICS: string;
    readonly VITE_ENABLE_LIVE_AUDIO: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
