import { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';

interface Message {
    role: 'user' | 'model';
    text: string;
}

/**
 * Custom hook for managing Gemini chat sessions
 * Handles chat initialization, message sending, and loading states
 * 
 * @param systemInstruction - Optional system instruction for the chat
 * @returns Object with messages, sendMessage, loading state, and error
 */
export function useGeminiChat(systemInstruction?: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatSessionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize chat session
        try {
            chatSessionRef.current = createChatSession();
            setMessages([
                {
                    role: 'model',
                    text: 'Hi! I am your HirePrep Assistant. How can I help with your career today?',
                },
            ]);
        } catch (err) {
            console.error('Failed to initialize chat session:', err);
            setError('Failed to initialize chat. Please check your API key.');
        }
    }, [systemInstruction]);

    const sendMessage = async (userMessage: string) => {
        if (!userMessage.trim() || loading || !chatSessionRef.current) {
            return;
        }

        setLoading(true);
        setError(null);

        // Add user message immediately
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

        try {
            const result = await chatSessionRef.current.sendMessage({ message: userMessage });
            setMessages(prev => [...prev, { role: 'model', text: result.text }]);
        } catch (err) {
            console.error('Error sending message:', err);
            setError("Sorry, I'm having trouble connecting. Please try again.");
            setMessages(prev => [
                ...prev,
                {
                    role: 'model',
                    text: "Sorry, I'm having trouble connecting. Try again?",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const clearMessages = () => {
        setMessages([
            {
                role: 'model',
                text: 'Hi! I am your HirePrep Assistant. How can I help with your career today?',
            },
        ]);
    };

    return {
        messages,
        sendMessage,
        loading,
        error,
        clearMessages,
    };
}

export default useGeminiChat;
