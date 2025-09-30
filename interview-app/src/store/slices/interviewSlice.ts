import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Message, InterviewProgress, ParsedResumeData, QuestionTimer, InterviewSession } from '../../types';

export interface InterviewState {
  isActive: boolean;
  isPaused: boolean;
  messages: Message[];
  currentQuestion: string | null;
  currentQuestionNumber: number;
  allQuestions: Array<{ id: string; question: string; answer?: string; score?: number; difficulty?: string; timeLimit?: number; }>;
  resumeContent: string | null;
  parsedResumeData: ParsedResumeData | null;
  jobDescription: string | null;
  interviewType: 'technical' | 'behavioral' | 'mixed';
  difficulty: 'junior' | 'mid' | 'senior';
  progress: InterviewProgress;
  questionTimer: QuestionTimer;
  overallTimer: {
    totalMinutes: number;
    timeRemaining: number;
    isActive: boolean;
  };
  sessions: InterviewSession[];
  currentSessionId: string | null;
  candidateInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const initialState: InterviewState = {
  isActive: false,
  isPaused: false,
  messages: [],
  currentQuestion: null,
  currentQuestionNumber: 1,
  allQuestions: [],
  resumeContent: null,
  parsedResumeData: null,
  jobDescription: null,
  interviewType: 'mixed',
  difficulty: 'mid',
  progress: {
    questionsAsked: 0,
    totalQuestions: 10,
    currentScore: 0,
    averageScore: 0,
    isCompleted: false,
  },
  questionTimer: {
    timeLimit: 60,
    timeRemaining: 60,
    isActive: false,
  },
  overallTimer: {
    totalMinutes: 15,
    timeRemaining: 900,
    isActive: false,
  },
  sessions: [],
  currentSessionId: null,
  candidateInfo: {},
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview: (state) => {
      const sessionId = Date.now().toString();
      state.isActive = true;
      state.isPaused = false;
      state.messages = [];
      state.currentQuestionNumber = 1;
      state.progress.questionsAsked = 0;
      state.progress.currentScore = 0;
      state.progress.averageScore = 0;
      state.progress.isCompleted = false;
      state.currentSessionId = sessionId;
      
      // Start overall timer
      state.overallTimer.timeRemaining = state.overallTimer.totalMinutes * 60;
      state.overallTimer.isActive = true;
      
      // Create new session
      const newSession: InterviewSession = {
        id: sessionId,
        candidateName: state.candidateInfo.name || 'Unknown Candidate',
        startTime: new Date(),
        status: 'active',
      };
      state.sessions.push(newSession);
    },
    
    pauseInterview: (state) => {
      state.isPaused = true;
      state.questionTimer.isActive = false;
      state.overallTimer.isActive = false;
      // Update current session status
      const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
      if (currentSession) {
        currentSession.status = 'paused';
      }
    },
    
    resumeInterview: (state) => {
      state.isPaused = false;
      state.overallTimer.isActive = true;
      // Update current session status
      const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
      if (currentSession) {
        currentSession.status = 'active';
      }
    },
    
    endInterview: (state, action: PayloadAction<{ finalScore?: number; summary?: string }>) => {
      state.isActive = false;
      state.isPaused = false;
      state.currentQuestion = null;
      state.questionTimer.isActive = false;
      state.overallTimer.isActive = false;
      state.progress.isCompleted = true;
      
      // Update current session
      const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
      if (currentSession) {
        currentSession.status = 'completed';
        currentSession.endTime = new Date();
        currentSession.finalScore = action.payload.finalScore || state.progress.averageScore;
        currentSession.summary = action.payload.summary;
      }
    },
    
    addMessage: (state, action: PayloadAction<Omit<Message, 'id' | 'timestamp'>>) => {
      const newMessage: Message = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      state.messages.push(newMessage);
    },
    
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    
    setCurrentQuestion: (state, action: PayloadAction<{ question: string; timeLimit?: number }>) => {
      state.currentQuestion = action.payload.question;
      state.currentQuestionNumber += 1;
      state.progress.questionsAsked = state.currentQuestionNumber;
      
      // Set timer based on difficulty
      const timeLimit = action.payload.timeLimit || getTimeLimitForDifficulty(state.difficulty);
      state.questionTimer = {
        timeLimit,
        timeRemaining: timeLimit,
        isActive: true,
      };
    },
    
    updateTimer: (state, action: PayloadAction<number>) => {
      if (state.questionTimer.isActive) {
        state.questionTimer.timeRemaining = Math.max(0, action.payload);
        if (state.questionTimer.timeRemaining === 0) {
          state.questionTimer.isActive = false;
        }
      }
    },
    
    setResumeContent: (state, action: PayloadAction<string>) => {
      state.resumeContent = action.payload;
    },
    
    setParsedResumeData: (state, action: PayloadAction<ParsedResumeData>) => {
      state.parsedResumeData = action.payload;
      // Extract candidate info
      if (action.payload.name) state.candidateInfo.name = action.payload.name;
      if (action.payload.email) state.candidateInfo.email = action.payload.email;
      if (action.payload.phone) state.candidateInfo.phone = action.payload.phone;
    },
    
    setJobDescription: (state, action: PayloadAction<string>) => {
      state.jobDescription = action.payload;
    },
    
    setInterviewConfig: (state, action: PayloadAction<{
      type: InterviewState['interviewType'];
      difficulty: InterviewState['difficulty'];
      totalQuestions: number;
      timeLimit?: number;
    }>) => {
      state.interviewType = action.payload.type;
      state.difficulty = action.payload.difficulty;
      state.progress.totalQuestions = action.payload.totalQuestions;
      if (action.payload.timeLimit) {
        state.overallTimer.totalMinutes = action.payload.timeLimit;
      }
    },
    
    setAllQuestions: (state, action: PayloadAction<Array<{ id: string; question: string; }>>) => {
      state.allQuestions = action.payload;
    },
    
    updateOverallTimer: (state, action: PayloadAction<number>) => {
      if (state.overallTimer.isActive) {
        state.overallTimer.timeRemaining = Math.max(0, action.payload);
        if (state.overallTimer.timeRemaining === 0) {
          state.overallTimer.isActive = false;
        }
      }
    },
    
    navigateToQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestionNumber = action.payload;
      const question = state.allQuestions[action.payload - 1];
      if (question) {
        state.currentQuestion = question.question;
      }
    },
    
    updateQuestionAnswer: (state, action: PayloadAction<{ questionId: string; answer: string; score?: number }>) => {
      const question = state.allQuestions.find(q => q.id === action.payload.questionId);
      if (question) {
        question.answer = action.payload.answer;
        if (action.payload.score !== undefined) {
          question.score = action.payload.score;
        }
      }
    },
    
    updateQuestionScore: (state, action: PayloadAction<{ questionId: string; score: number }>) => {
      // Find the message and update its score
      const message = state.messages.find(m => m.id === action.payload.questionId);
      if (message) {
        message.score = action.payload.score;
      }
      
      // Recalculate average score
      const scoredMessages = state.messages.filter(m => m.score !== undefined);
      if (scoredMessages.length > 0) {
        const totalScore = scoredMessages.reduce((sum, m) => sum + (m.score || 0), 0);
        state.progress.averageScore = Math.round(totalScore / scoredMessages.length);
        state.progress.currentScore = action.payload.score;
      }
    },
    
    setCandidateInfo: (state, action: PayloadAction<{ name?: string; email?: string; phone?: string }>) => {
      state.candidateInfo = { ...state.candidateInfo, ...action.payload };
    },
    
    clearInterview: (state) => {
      return { ...initialState, sessions: state.sessions }; // Keep sessions history
    },
  },
});

// Helper function to get time limit based on difficulty
function getTimeLimitForDifficulty(difficulty: string): number {
  switch (difficulty) {
    case 'junior': return 20; // 20 seconds for easy questions
    case 'mid': return 60;    // 60 seconds for medium questions  
    case 'senior': return 120; // 120 seconds for hard questions
    default: return 60;
  }
}

export const {
  startInterview,
  pauseInterview,
  resumeInterview,
  endInterview,
  addMessage,
  setMessages,
  setCurrentQuestion,
  updateTimer,
  setResumeContent,
  setParsedResumeData,
  setJobDescription,
  setInterviewConfig,
  updateQuestionScore,
  setCandidateInfo,
  clearInterview,
  setAllQuestions,
  updateOverallTimer,
  navigateToQuestion,
  updateQuestionAnswer,
} = interviewSlice.actions;

export default interviewSlice.reducer;