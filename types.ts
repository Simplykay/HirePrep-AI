
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export type SubscriptionTier = 'Free' | 'Weekly' | 'Monthly' | 'Yearly';

export interface InterviewResult {
  id: string;
  date: string;
  role: string;
  score: number;
  feedback: FeedbackData;
}

export interface UserProfile {
  name: string;
  email: string;
  isPremium: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry?: string;
  interviewsCompleted: number;
  avatarUrl?: string;
  history: InterviewResult[];
  lastSessionState?: InterviewState;
}

export interface InterviewState {
  cvText: string;
  jobDescription: string;
  jobRole: string;
  jobLocation: string;
  industry: string;
  difficulty: Difficulty;
  isRandomized: boolean;
}

export interface Suggestion {
  text: string;
  rationale: string;
}

export interface FeedbackData {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
  technicalAccuracy: number;
  communicationSkills: number;
  confidence: number;
  toneScore: number;
  paceScore: number;
  clarityScore: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
