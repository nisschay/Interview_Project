import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface InterviewState {
  isActive: boolean;
  messages: Message[];
  currentQuestion: string | null;
  resumeContent: string | null;
  jobDescription: string | null;
  interviewType: 'technical' | 'behavioral' | 'mixed';
  difficulty: 'junior' | 'mid' | 'senior';
  progress: {
    questionsAsked: number;
    totalQuestions: number;
    score: number;
  };
}

const initialState: InterviewState = {
  isActive: false,
  messages: [],
  currentQuestion: null,
  resumeContent: null,
  jobDescription: null,
  interviewType: 'technical',
  difficulty: 'mid',
  progress: {
    questionsAsked: 0,
    totalQuestions: 10,
    score: 0,
  },
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview: (state) => {
      state.isActive = true;
      state.messages = [];
      state.progress.questionsAsked = 0;
      state.progress.score = 0;
    },
    endInterview: (state) => {
      state.isActive = false;
      state.currentQuestion = null;
    },
    addMessage: (state, action: PayloadAction<Omit<Message, 'id' | 'timestamp'>>) => {
      const newMessage: Message = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      state.messages.push(newMessage);
    },
    setCurrentQuestion: (state, action: PayloadAction<string>) => {
      state.currentQuestion = action.payload;
      state.progress.questionsAsked += 1;
    },
    setResumeContent: (state, action: PayloadAction<string>) => {
      state.resumeContent = action.payload;
    },
    setJobDescription: (state, action: PayloadAction<string>) => {
      state.jobDescription = action.payload;
    },
    setInterviewConfig: (state, action: PayloadAction<{
      type: InterviewState['interviewType'];
      difficulty: InterviewState['difficulty'];
      totalQuestions: number;
    }>) => {
      state.interviewType = action.payload.type;
      state.difficulty = action.payload.difficulty;
      state.progress.totalQuestions = action.payload.totalQuestions;
    },
    updateScore: (state, action: PayloadAction<number>) => {
      state.progress.score = action.payload;
    },
  },
});

export const {
  startInterview,
  endInterview,
  addMessage,
  setCurrentQuestion,
  setResumeContent,
  setJobDescription,
  setInterviewConfig,
  updateScore,
} = interviewSlice.actions;

export default interviewSlice.reducer;