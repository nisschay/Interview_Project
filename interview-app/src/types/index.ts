export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface InterviewConfig {
  type: 'technical' | 'behavioral' | 'mixed';
  difficulty: 'junior' | 'mid' | 'senior';
  totalQuestions: number;
}

export interface InterviewProgress {
  questionsAsked: number;
  totalQuestions: number;
  score: number;
}

export interface FileUpload {
  name: string;
  type: string;
  content: string;
  size: number;
}