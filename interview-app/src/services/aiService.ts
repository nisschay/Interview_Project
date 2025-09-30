export interface AIResponse {
  content: string;
  confidence: number;
  suggestions?: string[];
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

class GeminiAIService {
  private apiKey: string = '';
  private model: string = 'gemini-2.5-flash-exp';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    // Production API key - embedded for server deployment
    this.apiKey = 'AIzaSyDjEV3JYsJmZ7H6QTao3OoGVE0ISm-yAJU';
    console.log('🤖 AI Service initialized with Gemini API');
  }

  setApiKey(key: string) {
    this.apiKey = key;
    console.log('🔑 API key updated');
  }

  setModel(model: string) {
    this.model = model;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      console.warn('⚠️  No Gemini API key set. Using mock responses.');
      return this.getMockResponse(prompt);
    }

    const request: GeminiRequest = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.9 + (Math.random() * 0.2), // 0.9-1.1 for more variety
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!content) {
        console.warn('Empty response from Gemini, using fallback');
        return this.getMockResponse(prompt);
      }
      
      return content;
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getMockResponse(prompt);
    }
  }

  private getMockResponse(prompt: string): string {
    // Role-aware fallback questions
    if (prompt.toLowerCase().includes('data scientist') || prompt.toLowerCase().includes('data-scientist')) {
      const dataScientistQuestions = [
        "What is the difference between supervised and unsupervised learning?",
        "Explain what a confusion matrix is and how you interpret precision, recall, and F1-score.",
        "How would you handle missing data in a dataset? Explain different imputation techniques.",
        "What is overfitting and how can you prevent it in machine learning models?",
        "Explain the bias-variance tradeoff in machine learning.",
        "How do you evaluate the performance of a classification model?",
        "What is the difference between bagging and boosting ensemble methods?",
        "Explain feature engineering and why it's important in machine learning."
      ];
      return dataScientistQuestions[Math.floor(Math.random() * dataScientistQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('data engineer') || prompt.toLowerCase().includes('data-engineer')) {
      const dataEngineerQuestions = [
        "What is the difference between ETL and ELT processes?",
        "How would you design a data pipeline for processing large-scale data?",
        "Explain the concept of data partitioning and when you would use it.",
        "What are the differences between OLTP and OLAP databases?",
        "How do you ensure data quality in a data pipeline?",
        "Explain star schema vs snowflake schema in data warehousing.",
        "What is Apache Spark and how does it differ from Hadoop MapReduce?",
        "How would you optimize a slow SQL query?"
      ];
      return dataEngineerQuestions[Math.floor(Math.random() * dataEngineerQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('ai') || prompt.toLowerCase().includes('ml engineer')) {
      const aiMlQuestions = [
        "Explain the architecture of a Convolutional Neural Network (CNN).",
        "What is transfer learning and when would you use it?",
        "How does backpropagation work in neural networks?",
        "Explain the difference between RNNs and LSTMs.",
        "What is the vanishing gradient problem and how do you solve it?",
        "How would you deploy a machine learning model to production?",
        "Explain attention mechanisms in transformer models.",
        "What is the difference between batch normalization and layer normalization?"
      ];
      return aiMlQuestions[Math.floor(Math.random() * aiMlQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('frontend')) {
      const frontendQuestions = [
        "What is the difference between let, const, and var in JavaScript?",
        "Explain the concept of closures in JavaScript with an example.",
        "How would you optimize a React application for better performance?",
        "What is the virtual DOM and how does React use it?",
        "Explain CSS Flexbox and when you would use it over CSS Grid.",
        "What are React hooks and why were they introduced?",
        "How do you ensure web accessibility (WCAG) in your applications?",
        "What is the difference between client-side and server-side rendering?"
      ];
      return frontendQuestions[Math.floor(Math.random() * frontendQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('backend')) {
      const backendQuestions = [
        "What is the difference between REST and GraphQL APIs?",
        "How would you design a scalable authentication system?",
        "Explain database indexing and when you would use it.",
        "What is the N+1 query problem and how do you solve it?",
        "How do you handle rate limiting in an API?",
        "Explain the CAP theorem in distributed systems.",
        "What is the difference between SQL and NoSQL databases?",
        "How would you implement caching to improve API performance?"
      ];
      return backendQuestions[Math.floor(Math.random() * backendQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('devops')) {
      const devopsQuestions = [
        "What is the difference between Docker and Kubernetes?",
        "How would you design a CI/CD pipeline for a web application?",
        "Explain Infrastructure as Code and its benefits.",
        "What is blue-green deployment and when would you use it?",
        "How do you monitor and debug issues in production?",
        "What is the difference between horizontal and vertical scaling?",
        "Explain container orchestration and why it's important.",
        "How would you ensure security in a DevOps pipeline?"
      ];
      return devopsQuestions[Math.floor(Math.random() * devopsQuestions.length)];
    }
    
    // Generic fallback
    const technicalQuestions = [
      "What is the difference between let, const, and var in JavaScript?",
      "Explain the concept of closures in JavaScript.",
      "What are the differences between SQL and NoSQL databases?",
      "Explain the concept of RESTful APIs.",
      "What is the difference between synchronous and asynchronous programming?",
      "Explain Big O notation and time complexity.",
      "How would you implement user authentication in a web application?",
      "What are the principles of clean code?"
    ];
    return technicalQuestions[Math.floor(Math.random() * technicalQuestions.length)];
  }

  async generateQuestion(
    resumeContent: string | null,
    jobDescription: string | null,
    interviewType: 'technical' | 'behavioral' | 'mixed',
    difficulty: 'junior' | 'mid' | 'senior',
    previousQuestions: string[] = [],
    questionNumber: number = 1
  ): Promise<AIResponse> {
    
    const difficultyContext = {
      junior: "entry-level, focusing on basic concepts and fundamentals",
      mid: "intermediate-level, covering practical experience and problem-solving",
      senior: "advanced-level, including architecture, leadership, and complex scenarios"
    };

    const typeContext = {
      technical: "focusing on programming skills, algorithms, system design, and technical knowledge",
      behavioral: "focusing on soft skills, teamwork, problem-solving approaches, and past experiences",
      mixed: "combining both technical skills and behavioral aspects"
    };

    const prompt = `
You are an expert technical interviewer conducting a ${difficulty}-level ${interviewType} interview. This is question #${questionNumber}.

CONTEXT:
- Resume: ${resumeContent || 'Not provided'}
- Job Description: ${jobDescription || 'General software development role'}
- Interview Type: ${interviewType} (${typeContext[interviewType]})
- Difficulty: ${difficulty} (${difficultyContext[difficulty]})
- Previous Questions: ${previousQuestions.length > 0 ? previousQuestions.join('; ') : 'None asked yet'}

REQUIREMENTS:
1. Generate a ${difficulty}-level ${interviewType} question that is:
   - Relevant to the job description and candidate's background
   - Different from previously asked questions
   - Appropriate for question #${questionNumber} in the interview flow
   - Encourages detailed, thoughtful responses

2. For technical questions, consider:
   - Programming concepts and best practices
   - Problem-solving and algorithm thinking
   - System design (for senior level)
   - Code quality and testing

3. For behavioral questions, consider:
   - Past experiences and problem-solving
   - Team collaboration and communication
   - Learning and adaptability
   - Leadership and initiative (for senior level)

4. Question progression guidelines:
   - Questions 1-2: Easier warm-up questions
   - Questions 3-4: Core competency questions
   - Questions 5+: More challenging, scenario-based questions

Generate ONE thoughtful interview question that fits these criteria. Return only the question, no additional text.`;

    try {
      const content = await this.callGeminiAPI(prompt);
      return {
        content: content.trim(),
        confidence: 0.9
      };
    } catch (error) {
      console.error('Error generating question:', error);
      const fallbackQuestions = {
        technical: "Can you walk me through your approach to solving a complex coding problem? What steps do you typically follow?",
        behavioral: "Tell me about a challenging project you worked on recently. What made it challenging and how did you handle it?",
        mixed: "Describe a time when you had to learn a new technology quickly. How did you approach the learning process?"
      };
      
      return {
        content: fallbackQuestions[interviewType] || fallbackQuestions.technical,
        confidence: 0.5
      };
    }
  }

  async evaluateAnswer(
    question: string,
    userAnswer: string,
    questionNumber: number
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    suggestions: string[];
  }> {    
    const prompt = `You are an expert technical interviewer. Evaluate the following answer strictly and provide a JSON response.

QUESTION: ${question}
CANDIDATE'S ANSWER: ${userAnswer}
QUESTION NUMBER: ${questionNumber}

Provide a JSON response with this exact structure:
{
  "score": <number 0-100>,
  "feedback": "<brief overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}

STRICT SCORING GUIDELINES:
- 90-100: Excellent, comprehensive answer with deep understanding
- 70-89: Good answer, demonstrates solid understanding with minor gaps  
- 50-69: Acceptable answer, shows basic understanding but lacks depth
- 30-49: Weak answer, significant gaps or inaccuracies
- 10-29: Poor answer, mostly incorrect or irrelevant
- 0-9: Completely wrong, gibberish, or no meaningful content

BE STRICT: Gibberish, nonsense, or completely irrelevant answers should score 0-5.

Respond ONLY with valid JSON, no additional text.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      
      // Try to parse JSON response
      try {
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanResponse);
        
        return {
          score: Math.min(100, Math.max(0, parsed.score || 0)),
          feedback: parsed.feedback || "Answer evaluated.",
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Shows some understanding"],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ["Provide more detail"]
        };
      } catch (parseError) {
        // Fallback parsing if JSON fails
        const scoreMatch = response.match(/[\"']?score[\"']?\s*:\s*(\d+)/i);
        const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;
        
        return {
          score,
          feedback: "Answer evaluated. Please see suggestions for improvement.",
          strengths: ["Attempted the question"],
          suggestions: ["Provide more specific examples", "Explain concepts more clearly"]
        };
      }
      
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        score: 50,
        feedback: "Unable to evaluate answer at this time.",
        suggestions: ["Try again with more detail"],
        strengths: ["Attempted the question"]
      };
    }
  }

  async generateFollowUp(
    originalQuestion: string, 
    answer: string, 
    context?: string
  ): Promise<AIResponse> {
    const prompt = `
Based on this interview exchange, generate a relevant follow-up question:

Original Question: ${originalQuestion}
Candidate's Answer: ${answer}
Context: ${context || 'General technical interview'}

Generate a follow-up question that:
1. Builds naturally on their answer
2. Probes deeper into their understanding
3. Is conversational and engaging
4. Tests practical application or explores edge cases

Return only the follow-up question.`;

    try {
      const content = await this.callGeminiAPI(prompt);
      return {
        content: content.trim(),
        confidence: 0.85
      };
    } catch (error) {
      console.error('Error generating follow-up:', error);
      return {
        content: "That's interesting. Can you walk me through how you would implement that in a real-world scenario?",
        confidence: 0.6
      };
    }
  }

  async generateFinalSummary(
    messages: Array<{ type: string; content: string; score?: number }>,
    candidateInfo: { name?: string; email?: string },
    interviewConfig: { type: string; difficulty: string }
  ): Promise<{
    overallScore: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendation: string;
  }> {
    
    const questions = messages.filter(m => m.type === 'ai').map(m => m.content);
    const answers = messages.filter(m => m.type === 'user').map(m => m.content);
    const scores = messages.filter(m => m.score !== undefined).map(m => m.score!);
    
    const prompt = `
Generate a final interview summary for ${candidateInfo.name || 'the candidate'}.

INTERVIEW DETAILS:
- Type: ${interviewConfig.type}
- Difficulty: ${interviewConfig.difficulty}
- Questions Asked: ${questions.length}
- Individual Scores: ${scores.join(', ') || 'No scores available'}

QUESTIONS AND ANSWERS:
${questions.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${answers[i] || 'No answer provided'}`).join('\n\n')}

Provide a comprehensive assessment including:

1. OVERALL SCORE (1-100): Average performance across all areas
2. SUMMARY (3-4 sentences): Overall assessment of the candidate
3. STRENGTHS (3-4 points): Key areas where the candidate excelled
4. IMPROVEMENTS (2-3 points): Areas for development
5. RECOMMENDATION: Hire/Consider/Pass with brief justification

Format as:
Overall Score: [number]
Summary: [summary text]
Strengths:
- [strength 1]
- [strength 2]
- [strength 3]
Improvements:
- [improvement 1]
- [improvement 2]
Recommendation: [recommendation with reason]`;

    try {
      const response = await this.callGeminiAPI(prompt);
      
      const scoreMatch = response.match(/Overall Score:\s*(\d+)/i);
      const summaryMatch = response.match(/Summary:\s*([^]*?)(?=Strengths:|$)/i);
      const strengthsMatch = response.match(/Strengths:\s*([^]*?)(?=Improvements:|$)/i);
      const improvementsMatch = response.match(/Improvements:\s*([^]*?)(?=Recommendation:|$)/i);
      const recommendationMatch = response.match(/Recommendation:\s*([^]*?)$/i);
      
      const parseListItems = (text: string): string[] => {
        return text.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-'))
          .map(line => line.replace(/^-\s*/, ''))
          .filter(line => line.length > 0);
      };
      
      const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
      const summary = summaryMatch ? summaryMatch[1].trim() : "Candidate demonstrated competency in the interview process.";
      const strengths = strengthsMatch ? parseListItems(strengthsMatch[1]) : ["Shows technical understanding"];
      const improvements = improvementsMatch ? parseListItems(improvementsMatch[1]) : ["Could provide more detailed explanations"];
      const recommendation = recommendationMatch ? recommendationMatch[1].trim() : "Consider for next round based on role requirements.";
      
      return { overallScore, summary, strengths, improvements, recommendation };
      
    } catch (error) {
      console.error('Error generating summary:', error);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
      return {
        overallScore: avgScore,
        summary: "The candidate participated in the interview and provided responses to the questions asked.",
        strengths: ["Engaged in the interview process", "Provided thoughtful responses"],
        improvements: ["Could elaborate more on technical details", "Practice explaining complex concepts"],
        recommendation: "Review performance and consider for next steps based on role requirements."
      };
    }
  }
}

// Export singleton instance
const aiService = new GeminiAIService();

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).aiService = aiService;
}

export default aiService;