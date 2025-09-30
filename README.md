# 🤖 AI-Powered Interview Platform

A comprehensive AI interview platform that conducts automated technical interviews with intelligent resume parsing, position-based screening, and real-time evaluation using Google Gemini AI.

![Platform Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![React](https://img.shields.io/badge/React-18+-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue) ![Gemini API](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-green)

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- **Node.js 18+** installed
- **Google Gemini API Key** ([Get it free here](https://makersuite.google.com/app/apikey))

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd Interview_Project

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../interview-app
npm install
```

### Step 2: Configure API Key

Create a `.env` file in the `server` folder:

```bash
cd server
nano .env
```

Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY=your_api_key_here
PORT=3001
```

**How to get API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and paste into `.env` file

### Step 3: Start the Backend Server

```bash
# From the server directory
cd server
node index.js
```

✅ You should see:
```
🚀 Resume parsing server running on http://localhost:3001
🔑 Gemini API Key: ✅ Configured
```

### Step 4: Start the Frontend

Open a **NEW TERMINAL** and run:

```bash
# From the project root
cd interview-app
npm run dev
```

✅ You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Open in Browser

Navigate to **http://localhost:5173** in your browser.

🎉 **You're ready to go!**

---

## ✨ Features

### 🎯 For Interviewees

1. **Position Selection**
   - Choose from 5 predefined positions:
     - 🧠 Data Scientist
     - 🔧 Data Engineer
     - 🎨 Frontend Developer
     - ⚙️ Backend Developer
     - 🤖 AI/ML Engineer

2. **Resume Upload (Required)**
   - Upload PDF or DOCX
   - AI extracts: Name, Email, Phone, Age, Summary
   - Manual field editing available
   - Gender selection dropdown

3. **Interview Configuration**
   - Type: Technical / Behavioral / Mixed
   - Difficulty: Junior / Mid / Senior
   - Questions: 5, 10, 15, or 20

4. **AI Interview**
   - Personalized questions based on resume & position
   - Real-time scoring and feedback
   - Timed responses
   - Progress tracking

### 📊 For Interviewers

1. **Live Monitoring**
   - Watch interviews in progress
   - View candidate responses
   - See scores in real-time

2. **Session Management**
   - Track all interview sessions
   - Review completed interviews
   - Compare candidates
   - Export reports

3. **Analytics Dashboard**
   - Average scores
   - Completion rates
   - Question performance
   - Candidate insights

---

## 📋 How to Use

### For Candidates:

1. **Navigate to Interviewee Tab**
2. **Configure Interview**
   - Select interview type (Technical/Behavioral/Mixed)
   - Choose difficulty level (Junior/Mid/Senior)
   - Set number of questions (5/10/15/20)

3. **Upload Resume** (Required)
   - Click "Upload Resume"
   - Select your PDF/DOCX file
   - Wait for AI parsing
   - Review extracted information
   - Fill missing fields (Name, Email, Phone required)
   - Select gender from dropdown
   - Click "Confirm Details"

4. **Select Position** (Required)
   - Choose from dropdown
   - Review auto-populated job description

5. **Start Interview**
   - Button enables when all requirements met
   - Answer AI-generated questions
   - Receive real-time feedback
   - Complete interview to see final score

### For Interviewers:

1. **Navigate to Interviewer Dashboard**
2. **Monitor Live Interviews**
   - See active sessions
   - Track progress
   - View responses

3. **Review Sessions**
   - Access completed interviews
   - Compare candidates
   - Analyze performance

---

## 🎨 Recent Updates (v2.0)

### ✅ What Changed?

#### 1. **Job Position Selection**
- **Before**: Interviewees typed job descriptions manually ❌
- **Now**: Select from predefined positions with detailed requirements ✅

#### 2. **Mandatory Resume Upload**
- **Before**: Optional resume upload
- **Now**: Required with full field validation ✅

#### 3. **Gender Field Improvement**
- **Before**: Text input (rarely filled)
- **Now**: Dropdown select (Male/Female/Other/Prefer not to say) ✅

#### 4. **Required Field Validation**
- **Before**: Could start interview with missing data
- **Now**: Must complete Name, Email, Phone before proceeding ✅

#### 5. **Full Screen UI**
- **Before**: Excessive whitespace (~60% screen usage)
- **Now**: Optimized layout (~95% screen usage) ✅

---

## 🏗️ Project Structure

```
Interview_Project/
├── server/                      # Backend (Express + Gemini AI)
│   ├── index.js                # Main server file
│   ├── package.json            # Backend dependencies
│   └── .env                    # API keys (create this)
│
├── interview-app/              # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Chat/          # Interview chat interface
│   │   │   ├── Layout/        # App layout
│   │   │   ├── ResumeParser/  # Resume upload & parsing
│   │   │   └── Settings/      # API configuration
│   │   ├── pages/             # Main pages
│   │   │   ├── IntervieweePage.tsx
│   │   │   └── InterviewerPage.tsx
│   │   ├── services/          # API services
│   │   ├── store/             # Redux state management
│   │   └── types/             # TypeScript types
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
│
└── README.md                   # This file
```

---

## 🔧 Technical Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Ant Design** - UI components
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX text extraction
- **Google Gemini AI** - Question generation & resume parsing

---

## 🎯 Available Positions

Each position comes with detailed requirements and responsibilities:

### 🧠 Data Scientist
- 3+ years in ML and data analysis
- Python, R, SQL, data visualization
- TensorFlow, PyTorch, Scikit-learn
- Statistical analysis & hypothesis testing
- Big data (Spark, Hadoop)
- Cloud platforms (AWS, GCP, Azure)

### 🔧 Data Engineer
- 4+ years in data engineering
- SQL, Python, ETL processes
- Snowflake, Redshift, BigQuery
- Kafka, Kinesis
- Data modeling & architecture
- Airflow, Prefect

### 🎨 Frontend Developer
- 3+ years frontend development
- React, TypeScript, JavaScript
- Redux, Zustand
- CSS frameworks, responsive design
- Jest, Cypress
- Build tools & CI/CD

### ⚙️ Backend Developer
- 4+ years server-side development
- Node.js, Python, or Java
- PostgreSQL, MongoDB
- API design, microservices
- Cloud services, containerization
- Message queues, caching

### 🤖 AI/ML Engineer
- 3+ years AI/ML development
- MLOps, model deployment
- Deep learning, neural networks
- Model optimization
- TensorFlow, PyTorch
- AWS SageMaker, GCP AI

---

## 📊 Interview Flow

```
┌─────────────────────────────────┐
│ 1. Configure Interview          │
│    ├─ Type (Technical/etc)      │
│    ├─ Difficulty (Junior/etc)   │
│    └─ Questions (5/10/15/20)    │
├─────────────────────────────────┤
│ 2. Upload Resume (Required)     │
│    ├─ AI Parse                  │
│    ├─ Fill Name ✓               │
│    ├─ Fill Email ✓              │
│    ├─ Fill Phone ✓              │
│    ├─ Select Gender             │
│    └─ Confirm Details ✓         │
├─────────────────────────────────┤
│ 3. Select Position (Required)   │
│    └─ Job description auto-fills│
├─────────────────────────────────┤
│ 4. Start Interview              │
│    ├─ AI generates questions    │
│    ├─ Answer with timer         │
│    ├─ Receive real-time scores  │
│    └─ Complete assessment       │
└─────────────────────────────────┘
```

---

## 🧪 Testing Guide

### Quick Test Checklist:

1. ✅ **Resume Upload & Parsing**
   - Upload a resume (PDF/DOCX)
   - Verify fields are extracted
   - Check gender dropdown appears
   - Fill required fields

2. ✅ **Required Field Validation**
   - Try confirming without all fields → Should be disabled
   - Fill Name, Email, Phone → Button enables
   - Select gender from dropdown

3. ✅ **Position Selection**
   - Select a position from dropdown
   - Verify job description appears
   - Check details are relevant

4. ✅ **Start Interview**
   - Ensure all requirements met
   - Click "Start Interview Now"
   - Verify interview begins
   - Answer questions

5. ✅ **UI Screen Coverage**
   - Check layout uses full width
   - Verify minimal whitespace
   - Cards are compact and well-spaced

---

## 🐛 Troubleshooting

### Backend Not Starting?
```bash
# Check if port 3001 is available
lsof -i :3001

# If occupied, kill the process or change PORT in .env
# Then restart: node index.js
```

### Frontend Not Starting?
```bash
# Check if port 5173 is available
lsof -i :5173

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Resume Upload Failing?
- ✅ Check backend server is running on port 3001
- ✅ Check GEMINI_API_KEY is set in `.env`
- ✅ Check file is PDF or DOCX format
- ✅ Check file size < 10MB

### Gender Not Being Filled?
- ℹ️ This is normal - most resumes don't include gender
- ℹ️ Users should select from the dropdown manually

### Can't Start Interview?
Check all requirements:
- ✅ Resume uploaded and confirmed?
- ✅ Position selected?
- ✅ All required fields (Name/Email/Phone) filled?

---

## 📦 Package Scripts

### Backend (server/)
```bash
node index.js      # Start server
```

### Frontend (interview-app/)
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🔐 Environment Variables

### Backend (.env file in `server/` folder)

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (defaults shown)
PORT=3001
```

---

## 🔮 Future Enhancements

### Phase 1: Position Management (Next)
- [ ] Interviewer can create/edit/delete positions
- [ ] CRUD interface for job positions
- [ ] Multiple position postings
- [ ] Application tracking per position

### Phase 2: Advanced Features
- [ ] Multi-round interviews
- [ ] Custom question banks
- [ ] Interview templates
- [ ] Advanced analytics

### Phase 3: Integrations
- [ ] Email notifications
- [ ] Calendar integration
- [ ] ATS (Applicant Tracking System) integration
- [ ] Export to PDF reports

### Phase 4: AI Enhancements
- [ ] Smart position matching
- [ ] AI question generation from job description
- [ ] Personality-based interviewer styles
- [ ] Voice interview support

---

## 🎉 Quick Command Reference

```bash
# TERMINAL 1 - Backend
cd server
npm install
# Create .env with GEMINI_API_KEY=your_key_here
node index.js

# TERMINAL 2 - Frontend (NEW TERMINAL)
cd interview-app
npm install
npm run dev

# Open browser: http://localhost:5173
```

**That's it! Happy interviewing! 🚀**

---

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Ant Design](https://ant.design/)
- [Vite](https://vitejs.dev/)
- [Google Gemini AI](https://ai.google.dev/)
- [Express](https://expressjs.com/)

---

## 📄 License

MIT License - feel free to use this project for your own interviews!
