## 🚀 QUICK START - How to Run Locally

### Method 1: Using the Start Script (Easiest)

```bash
cd /root/Interview_Project
./start.sh
```

This will automatically:
- Install dependencies (if needed)
- Start backend on http://localhost:3001
- Start frontend on http://localhost:5173
- Open http://localhost:5173 in your browser

Press `Ctrl+C` to stop both servers.

---

### Method 2: Manual Start (Two Terminals)

#### Terminal 1 - Backend:
```bash
cd /root/Interview_Project/server
node index.js
```

You should see:
```
🚀 Resume parsing server running on http://localhost:3001
🔑 Gemini API Key: ✅ Configured
```

#### Terminal 2 - Frontend (NEW TERMINAL):
```bash
cd /root/Interview_Project/interview-app
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

#### Open Browser:
Navigate to: **http://localhost:5173**

---

### First Time Setup (If Dependencies Not Installed)

If you get errors, install dependencies first:

```bash
# Install backend dependencies
cd /root/Interview_Project/server
npm install

# Install frontend dependencies  
cd /root/Interview_Project/interview-app
npm install
```

Then use Method 1 or Method 2 above.

---

### Troubleshooting

**Port already in use?**
```bash
# Check what's using the port
lsof -i :3001  # backend
lsof -i :5173  # frontend

# Kill the process
kill -9 <PID>
```

**Cannot connect to backend?**
- Make sure backend is running (Terminal 1)
- Check http://localhost:3001/api/health in browser
- Should return: `{"status":"ok","geminiConfigured":true}`

**Page not loading?**
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private window
- Check browser console for errors (F12)

---

### API Key Configuration

Make sure your `.env` file in the `server/` folder contains:
```
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
```

Get your API key from: https://makersuite.google.com/app/apikey

---

### What to Expect

1. **Backend starts** → You'll see server logs
2. **Frontend starts** → Vite will compile and show URL
3. **Open browser** → Navigate to http://localhost:5173
4. **See the app** → AI Interview Platform loads
5. **Start testing** → Upload resume, select position, begin interview

---

### Quick Test After Starting

1. Go to http://localhost:5173
2. Click on "Interviewee" tab (should be default)
3. Upload a resume (PDF or DOCX)
4. Fill required fields
5. Select a job position
6. Click "Start Interview"
7. Answer AI questions
8. See your score!

---

**Need help?** Check the main README.md for full documentation.
