
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export type AfricanRegion = 
  | 'Nigeria (West)' 
  | 'Kenya (East)' 
  | 'South Africa (South)' 
  | 'Egypt (North)' 
  | 'Ghana (West)' 
  | 'Ethiopia (East)' 
  | 'Remote / Pan-African'
  | 'Global / International';

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
  region: AfricanRegion;
  isRandomized: boolean;
}

export interface Suggestion {
  text: string;
  rationale: string;
}

export interface SkillGap {
  skill: string;
  status: 'matched' | 'missing' | 'partial';
  advice: string;
}

export interface FeedbackData {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
  skillGaps: SkillGap[];
  marketInsights: string;
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
