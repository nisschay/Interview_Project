export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  questionNumber?: number;
  score?: number;
}

export interface InterviewConfig {
  type: 'technical' | 'behavioral' | 'mixed';
  difficulty: 'junior' | 'mid' | 'senior';
  totalQuestions: number;
}

export interface InterviewProgress {
  questionsAsked: number;
  totalQuestions: number;
  currentScore: number;
  averageScore: number;
  isCompleted: boolean;
  timeRemaining?: number;
}

export interface ParsedResumeData {
  name?: string;
  age?: string;
  gender?: string;
  phone?: string;
  email?: string;
  summary?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  rawText?: string;
}

export interface QuestionTimer {
  timeLimit: number; // in seconds
  timeRemaining: number;
  isActive: boolean;
}

export interface InterviewSession {
  id: string;
  candidateName: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  finalScore?: number;
  summary?: string;
}