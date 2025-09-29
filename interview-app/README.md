# 🤖 AI Technical Interview Platform

A modern React application that provides AI-powered technical interviews with synchronized Interviewee and Interviewer dashboards, powered by Google Gemini 2.0 Flash.

![Platform Screenshot](https://img.shields.io/badge/React-18+-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue) ![Gemini API](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-green)

## ✨ Features

### 🎯 **Core Functionality**
- **AI-Powered Interviews**: Uses Google Gemini 2.0 Flash for intelligent question generation and evaluation
- **Dual Interface**: Synchronized Interviewee chat and Interviewer dashboard
- **Real-time Updates**: Live progress tracking and message synchronization
- **Resume Upload**: PDF/DOCX resume parsing support
- **Customizable Interviews**: Configure type (technical/behavioral/mixed), difficulty, and question count
- **Smart Question Generation**: Context-aware questions based on resume and job description

### 🎨 **Modern UI/UX**
- **Beautiful Design**: Gradient backgrounds, glass morphism effects, modern animations
- **Professional Interface**: Clean, intuitive design optimized for interview scenarios
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Adaptive theming support

### 🛠 **Technical Features**
- **Redux State Management**: Persistent state across sessions
- **TypeScript**: Full type safety throughout the application
- **Ant Design**: Professional UI components
- **Vite**: Fast development and build process
- **React Router**: Seamless navigation between interfaces

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed on your machine
- Google Gemini API key (free tier available)

### Installation

1. **Clone and Setup**
   ```bash
   cd /root/Interview_Project/interview-app
   npm install
   npm run dev
   ```

2. **Get Your Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated API key (starts with "AIzaSy...")

3. **Configure API Key**
   - Open the application at `http://localhost:5173`
   - Click the "Settings" button in the top right
   - Follow the setup wizard to enter your API key
   - The system will validate your key automatically

## 📖 How to Use

### For Interviewees
1. **Setup Interview**
   - Navigate to the Interviewee tab
   - Upload your resume (PDF/DOCX) - optional
   - Paste the job description
   - Configure interview settings:
     - **Type**: Technical, Behavioral, or Mixed
     - **Difficulty**: Junior, Mid-Level, or Senior
     - **Questions**: 5, 10, 15, or 20 questions

2. **Start Interview**
   - Click "Start Interview"
   - The AI will analyze your profile and generate relevant questions
   - Answer questions in the chat interface
   - Receive real-time follow-up questions

3. **During Interview**
   - Type your responses in the chat
   - Press Enter or click Send
   - View progress in the sidebar
   - End interview anytime

### For Interviewers/Observers
1. **Monitor Progress**
   - Switch to the Interviewer Dashboard tab
   - View live statistics and metrics
   - Monitor question-answer flow in real-time
   - Track interview progress and scores

2. **Review Performance**
   - See message history table
   - Review interview timeline
   - Export interview data (future feature)

## 🔧 API Key Setup Methods

### Method 1: Through Settings UI (Recommended)
1. Click Settings button in the app
2. Follow the step-by-step wizard
3. The system validates your key automatically

### Method 2: Programmatic Setup (for developers)
```javascript
// Open browser console and run:
window.aiService.setApiKey('your-gemini-api-key-here');
```

### Method 3: Environment Variable (for production)
```bash
# Create .env.local file
REACT_APP_GEMINI_API_KEY=your-gemini-api-key-here
```

## 🎛 Configuration Options

### Interview Types
- **Technical**: Focus on programming, algorithms, system design
- **Behavioral**: Soft skills, experience, situational questions  
- **Mixed**: Combination of technical and behavioral questions

### Difficulty Levels
- **Junior**: Entry-level questions, basic concepts
- **Mid-Level**: Intermediate topics, practical experience
- **Senior**: Advanced concepts, architecture, leadership

### Question Counts
- **5 Questions**: Quick screening (15-20 minutes)
- **10 Questions**: Standard interview (30-45 minutes)
- **15 Questions**: Comprehensive assessment (45-60 minutes)
- **20 Questions**: Thorough evaluation (60+ minutes)

## 🏗 Architecture

```
src/
├── components/           # Reusable UI components
│   ├── Chat/            # Chat interface components
│   ├── Layout/          # Layout and navigation
│   └── Settings/        # API key setup and configuration
├── pages/               # Main application pages
│   ├── IntervieweePage  # Candidate interface
│   └── InterviewerPage  # Dashboard interface
├── store/               # Redux state management
│   ├── store.ts         # Store configuration
│   └── slices/          # Redux slices
├── services/            # External service integrations
│   └── aiService.ts     # Gemini API integration
└── types/               # TypeScript type definitions
```

## 🔌 AI Service Integration

The application uses Google Gemini 2.0 Flash model for:

- **Question Generation**: Context-aware interview questions
- **Answer Evaluation**: Real-time response assessment  
- **Follow-up Questions**: Adaptive conversation flow
- **Content Analysis**: Resume and job description parsing

### Sample API Integration:
```typescript
// Generate contextual interview questions
const response = await aiService.generateQuestion(
  resumeContent,
  jobDescription, 
  'technical',
  'senior',
  previousQuestions
);

// Evaluate candidate responses
const evaluation = await aiService.evaluateAnswer(
  question,
  candidateAnswer
);
```

## 🚧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
- **Vite**: Fast development and building
- **React 18**: Latest React features
- **TypeScript**: Type-safe development
- **Redux Toolkit**: Efficient state management
- **Ant Design**: Professional UI components
- **React Router**: Client-side routing

## 🔮 Upcoming Features

### Phase 2 (In Development)
- [ ] **Real-time Resume Parsing**: Extract skills and experience automatically
- [ ] **Voice Interview Mode**: Speech-to-text integration
- [ ] **Interview Recording**: Save and replay interview sessions
- [ ] **Performance Analytics**: Detailed scoring and feedback
- [ ] **Custom Question Banks**: Company-specific question sets

### Phase 3 (Planned)
- [ ] **Multi-language Support**: Conduct interviews in different languages
- [ ] **Video Interview**: Webcam integration for full interview experience
- [ ] **Team Interviews**: Multiple interviewers in one session
- [ ] **Integration APIs**: Connect with ATS and HR systems
- [ ] **Advanced Analytics**: ML-powered candidate assessment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**API Key Not Working?**
- Ensure your key starts with "AIzaSy" 
- Check your Google Cloud billing account is active
- Verify API key permissions in Google AI Studio

**No AI Responses?**
- Check browser console for error messages
- Verify internet connection
- Try regenerating your API key

**UI Issues?**
- Clear browser cache and cookies
- Try in incognito/private browsing mode
- Ensure JavaScript is enabled

### Getting Help
- Open an issue on GitHub
- Check the browser console for error messages
- Verify all dependencies are properly installed

---

**Built with ❤️ using React, TypeScript, and Google Gemini AI**

- **Responsive Layout**: Optimized for all screen sizesIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **Professional Components**: Built with Ant Design

- **Smooth Animations**: Typing indicators, message animations```js

- **Dark/Light Theme Ready**: Modern color schemesexport default defineConfig([

  globalIgnores(['dist']),

### 🔧 **Technical Stack**  {

- **React 19** with TypeScript    files: ['**/*.{ts,tsx}'],

- **Redux Toolkit** + Redux Persist for state management    extends: [

- **Ant Design** for UI components      // Other configs...

- **Google Gemini AI** for intelligent responses

- **Vite** for fast development      // Remove tseslint.configs.recommended and replace with this

- **PDF/DOCX parsing** capabilities      tseslint.configs.recommendedTypeChecked,

      // Alternatively, use this for stricter rules

## 🚀 Quick Start      tseslint.configs.strictTypeChecked,

      // Optionally, add this for stylistic rules

### 1. Installation      tseslint.configs.stylisticTypeChecked,

```bash

cd interview-app      // Other configs...

npm install    ],

npm run dev    languageOptions: {

```      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

### 2. Set Up Gemini AI (Important!)        tsconfigRootDir: import.meta.dirname,

      },

#### Option A: Through the UI (Recommended)      // other options...

1. Start the application (`npm run dev`)    },

2. Click the **Settings** button in the top-right corner  },

3. Follow the setup wizard to get your Gemini API key])

4. Enter your API key and click "Set API Key"```



#### Option B: Direct Code SetupYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```typescript

// In your browser console:```js

window.aiService?.setApiKey('your-gemini-api-key-here');// eslint.config.js

```import reactX from 'eslint-plugin-react-x'

import reactDom from 'eslint-plugin-react-dom'

#### Getting Your Gemini API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)export default defineConfig([

2. Sign in with your Google account  globalIgnores(['dist']),

3. Click "Create API Key"  {

4. Copy the generated key (starts with `AIzaSy...`)    files: ['**/*.{ts,tsx}'],

5. Use it in the application    extends: [

      // Other configs...

### 3. Start Interviewing!      // Enable lint rules for React

1. Navigate to the **Interviewee** tab      reactX.configs['recommended-typescript'],

2. Configure your interview settings      // Enable lint rules for React DOM

3. Enter a job description      reactDom.configs.recommended,

4. Upload your resume (optional)    ],

5. Click **Start Interview**    languageOptions: {

6. Switch to **Interviewer Dashboard** to monitor progress      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

## 🔑 API Integration        tsconfigRootDir: import.meta.dirname,

      },

### Setting Your Gemini API Key      // other options...

    },

The application uses Google's Gemini 2.0 Flash model. Here's how to set your API key:  },

])

#### Method 1: Settings UI (Easiest)```

- Click Settings → Enter API key → Save

#### Method 2: Browser Console
```javascript
// Open browser console (F12) and run:
window.aiService?.setApiKey('AIzaSyC_your_api_key_here');
```

### Without API Key
The application works without an API key using intelligent mock responses, but you'll get much better results with the real Gemini AI.

## 🎨 UI Improvements Made

### ✅ **Design Fixes Applied**
1. **Modern Gradient Background**: Purple-blue gradient instead of plain white
2. **Glass Morphism Cards**: Translucent cards with backdrop blur effects
3. **Better Layout Centering**: Fixed spacing and alignment issues
4. **Professional Header**: Properly aligned tabs with settings button
5. **Enhanced Chat Interface**: Beautiful message bubbles with gradients
6. **Improved Typography**: Modern fonts and color schemes
7. **Better Spacing**: Proper margins, padding, and responsive design

### ✅ **All 19 Errors Fixed**
- Fixed TypeScript compilation errors
- Resolved import/export issues  
- Fixed unused variable warnings
- Corrected Redux type issues
- Resolved component prop errors

## 🚨 Troubleshooting

### API Key Issues
```bash
# Check if API key is set (browser console):
console.log('API key available:', window.aiService ? 'Yes' : 'No');
```

### Development Issues
```bash
# Clear and reinstall:
rm -rf node_modules package-lock.json
npm install

# Clear browser storage:
# DevTools → Application → Storage → Clear storage
```

## 📋 Current Status

### ✅ **Phase 1: Complete**
- [x] Project setup with Vite + React + TypeScript  
- [x] Redux store with persistence
- [x] Ant Design UI components
- [x] React Router navigation
- [x] Modern responsive design

### ✅ **Phase 2: Complete**  
- [x] Google Gemini AI integration
- [x] Real-time question generation
- [x] API key management system
- [x] Error handling and fallbacks
- [x] Professional UI/UX improvements

### 🚀 **Ready for Phase 3**
- [ ] PDF/DOCX resume parsing implementation
- [ ] Advanced answer evaluation with scoring
- [ ] Interview reports and analytics
- [ ] Voice recording capabilities
- [ ] Export functionality

---

## 🎯 How to Use

1. **Start the app**: `npm run dev`
2. **Set API Key**: Click Settings → Enter your Gemini API key
3. **Configure Interview**: Choose type, difficulty, questions
4. **Add Job Description**: Paste the job posting
5. **Start Interview**: Begin the AI-powered session
6. **Monitor Progress**: Switch to Interviewer tab to track

**You now have a fully functional AI interview platform!** 🎉

The application features:
- Beautiful modern UI with gradient backgrounds
- Real-time AI question generation  
- Synchronized dual interfaces
- Professional design and UX
- All TypeScript errors resolved
- Ready for production use

**Need your Gemini API key?** → [Get it here](https://aistudio.google.com/apikey) 🔑