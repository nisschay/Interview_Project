// Simple Express proxy to accept a resume file, extract text and call Gemini to parse fields.
// Install: npm i express multer pdf-parse mammoth dotenv
// Usage: set GEMINI_API_KEY in .env then: node server/index.js
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();
const cors = require('cors');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set in environment');
}

// Updated Gemini API call - using the correct endpoint
async function callGemini(prompt) {
  if (!GEMINI_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
  
  const body = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1000,
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Gemini API Error:', errorText);
    throw new Error(`Gemini API error: ${res.status} - ${errorText}`);
  }

  const json = await res.json();
  console.log('Gemini Response:', JSON.stringify(json, null, 2));
  
  // Extract text from response
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

app.post('/api/parse-resume', upload.single('file'), async (req, res) => {
  console.log('📄 Resume upload received:', req.file?.originalname);
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mime = req.file.mimetype || '';
    let extracted = '';

    // Extract text based on file type
    if (mime === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      console.log('📋 Parsing PDF...');
      const data = await pdfParse(req.file.buffer);
      extracted = data.text || '';
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || req.file.originalname.endsWith('.docx')) {
      console.log('📋 Parsing DOCX...');
      const { value } = await mammoth.extractRawText({ buffer: req.file.buffer });
      extracted = value || '';
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or DOCX.' });
    }

    console.log('📝 Extracted text length:', extracted.length);

    if (!extracted.trim()) {
      return res.status(400).json({ error: 'No text could be extracted from the file' });
    }

    // Improved prompt for better extraction
    const prompt = `
You are a resume parser. Extract the following information from this resume text and return ONLY a valid JSON object with these exact keys:

{
  "name": "full name of the person",
  "age": "age in years (if not found, estimate from graduation year or experience)",
  "gender": "gender if mentioned (otherwise leave empty)",
  "phone": "phone number with country code if available",
  "email": "email address",
  "summary": "brief 2-3 line professional summary"
}

Important rules:
- Return ONLY the JSON object, no other text
- If a field is not found, use empty string ""
- For phone numbers, include country code if available
- For age, if not explicitly mentioned, try to estimate from graduation dates or years of experience
- Keep summary concise and professional

Resume text:
"""
${extracted.substring(0, 8000)}
"""
`;

    console.log('🤖 Calling Gemini API...');
    const geminiResponse = await callGemini(prompt);
    console.log('✅ Gemini response received');

    // Try to parse JSON from response
    let parsedData = {};
    try {
      // Clean up the response - remove any markdown formatting
      let jsonText = geminiResponse.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object in the response
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd);
        parsedData = JSON.parse(jsonText);
        console.log('✅ Successfully parsed Gemini response:', parsedData);
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      console.log('Raw response:', geminiResponse);
      
      // Fallback: try to extract basic info with regex
      parsedData = {
        name: extractWithRegex(extracted, /(?:name|Name)[\s:]+([A-Za-z\s]+)/i) || '',
        age: extractWithRegex(extracted, /(?:age|Age)[\s:]+(\d+)/i) || '',
        gender: extractWithRegex(extracted, /(?:gender|Gender)[\s:]+([A-Za-z]+)/i) || '',
        phone: extractWithRegex(extracted, /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/i) || '',
        email: extractWithRegex(extracted, /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) || '',
        summary: 'Professional with experience in various domains'
      };
    }

    // Always include raw text
    parsedData.rawText = extracted;

    console.log('📤 Sending response:', parsedData);
    res.json(parsedData);

  } catch (err) {
    console.error('❌ Parse resume error:', err);
    res.status(500).json({ 
      error: 'Failed to parse resume',
      details: err.message 
    });
  }
});

// Helper function for regex extraction
function extractWithRegex(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

// Add this route before the app.listen() line
app.get('/', (req, res) => {
  res.json({ 
    message: 'Resume Parser API Server',
    status: 'running',
    endpoints: {
      health: '/api/health',
      parseResume: '/api/parse-resume (POST)'
    },
    geminiConfigured: !!GEMINI_KEY
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    geminiConfigured: !!GEMINI_KEY,
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Resume parsing server running on http://localhost:${port}`);
  console.log(`🔑 Gemini API Key: ${GEMINI_KEY ? '✅ Configured' : '❌ Missing'}`);
});