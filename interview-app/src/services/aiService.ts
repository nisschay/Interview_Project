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
        temperature: 0.7,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
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
    if (prompt.toLowerCase().includes('technical') || prompt.toLowerCase().includes('question')) {
      const technicalQuestions = [
        "What is the difference between `let`, `const`, and `var` in JavaScript? Can you provide examples of when you'd use each?",
        "Explain the concept of closures in JavaScript. How would you use them to create a private variable?",
        "How would you optimize a React application for better performance? Name at least 3 techniques.",
        "What are the differences between SQL and NoSQL databases? When would you choose one over the other?",
        "Explain the concept of RESTful APIs. What are the main HTTP methods and their purposes?",
        "How do you handle state management in large React applications? Compare Redux vs Context API.",
        "What is the difference between synchronous and asynchronous programming? How do promises work?",
        "Explain Big O notation. What's the time complexity of common array operations?",
        "How would you implement user authentication in a web application? What security measures would you include?",
        "What are the principles of clean code? How do you ensure code maintainability?"
      ];
      return technicalQuestions[Math.floor(Math.random() * technicalQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('behavioral')) {
      const behavioralQuestions = [
        "Tell me about a challenging project you worked on. How did you overcome the difficulties?",
        "Describe a time when you had to work with a difficult team member. How did you handle the situation?",
        "How do you prioritize your work when you have multiple deadlines?",
        "Tell me about a time you made a mistake in your code. How did you handle it?",
        "Describe your experience with code reviews. How do you give and receive feedback?",
        "How do you stay updated with new technologies and programming trends?",
        "Tell me about a time you had to learn a new technology quickly for a project.",
        "How do you approach debugging a complex issue?",
        "Describe your ideal work environment and team dynamics.",
        "What motivates you as a software developer?"
      ];
      return behavioralQuestions[Math.floor(Math.random() * behavioralQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('evaluate') || prompt.toLowerCase().includes('score')) {
      const evaluations = [
        "Score: 85\nFeedback: Excellent answer! You demonstrated solid understanding of the concept with clear explanations and good examples. Your knowledge of best practices is evident.\nSuggestions:\n- Consider mentioning edge cases\n- Could elaborate on performance implications\n- Adding real-world examples would strengthen the answer",
        
        "Score: 78\nFeedback: Good response showing understanding of core concepts. You explained the basics well and showed practical knowledge.\nSuggestions:\n- Provide more specific technical details\n- Include examples of implementation\n- Discuss potential pitfalls or common mistakes",
        
        "Score: 92\nFeedback: Outstanding answer! Comprehensive understanding with excellent practical examples. You covered multiple aspects and showed deep technical knowledge.\nSuggestions:\n- Perhaps mention alternative approaches\n- Could discuss scalability considerations\n- Testing strategies would add value",
        
        "Score: 65\nFeedback: Basic understanding demonstrated, but could be more thorough. The explanation covers fundamental concepts but lacks depth.\nSuggestions:\n- Provide more detailed explanations\n- Include concrete examples\n- Research advanced features of this topic",
        
        "Score: 88\nFeedback: Very good answer with strong technical foundation. Clear explanations and practical insights show good experience.\nSuggestions:\n- Could explore more advanced concepts\n- Mention industry best practices\n- Discuss debugging or troubleshooting approaches"
      ];
      return evaluations[Math.floor(Math.random() * evaluations.length)];
    }
    
    return "Thank you for your response. Can you provide more details about your approach to this problem?";
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
    answer: string, 
    questionNumber: number = 1,
    difficulty: 'junior' | 'mid' | 'senior' = 'mid'
  ): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
    strengths: string[];
    weaknesses: string[];
  }> {
    
    const prompt = `
You are an expert technical interviewer evaluating a candidate's answer. Provide a comprehensive assessment.

QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}
DIFFICULTY LEVEL: ${difficulty}
QUESTION NUMBER: ${questionNumber}

Please evaluate this answer and provide:

1. SCORE (1-100): Based on:
   - Technical accuracy and depth
   - Clarity of explanation
   - Practical understanding
   - Examples and real-world application
   - Appropriate level for ${difficulty} position

2. FEEDBACK (2-3 sentences): Constructive, encouraging feedback highlighting main points

3. STRENGTHS (2-3 bullet points): What the candidate did well

4. WEAKNESSES (1-2 bullet points): Areas that could be improved

5. SUGGESTIONS (2-3 bullet points): Specific recommendations for improvement

Format your response exactly as:
Score: [number]
Feedback: [feedback text]
Strengths:
- [strength 1]
- [strength 2]
Weaknesses:
- [weakness 1]
- [weakness 2]
Suggestions:
- [suggestion 1]
- [suggestion 2]
- [suggestion 3]`;

    try {
      const response = await this.callGeminiAPI(prompt);
      
      // Parse the structured response
      const scoreMatch = response.match(/Score:\s*(\d+)/i);
      const feedbackMatch = response.match(/Feedback:\s*([^]*?)(?=Strengths:|$)/i);
      const strengthsMatch = response.match(/Strengths:\s*([^]*?)(?=Weaknesses:|$)/i);
      const weaknessesMatch = response.match(/Weaknesses:\s*([^]*?)(?=Suggestions:|$)/i);
      const suggestionsMatch = response.match(/Suggestions:\s*([^]*?)$/i);
      
      const score = scoreMatch ? Math.min(100, Math.max(1, parseInt(scoreMatch[1]))) : 75;
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : "Good answer with room for improvement.";
      
      const parseListItems = (text: string): string[] => {
        return text.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-'))
          .map(line => line.replace(/^-\s*/, ''))
          .filter(line => line.length > 0);
      };
      
      const strengths = strengthsMatch ? parseListItems(strengthsMatch[1]) : ["Shows understanding of the concept"];
      const weaknesses = weaknessesMatch ? parseListItems(weaknessesMatch[1]) : ["Could provide more specific examples"];
      const suggestions = suggestionsMatch ? parseListItems(suggestionsMatch[1]) : [
        "Provide more specific examples",
        "Explain the underlying concepts in more detail"
      ];

      return { score, feedback, suggestions, strengths, weaknesses };
      
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        score: 75,
        feedback: "Thank you for your response. Your answer shows understanding of the topic.",
        suggestions: ["Provide more specific examples", "Explain your thought process", "Consider edge cases"],
        strengths: ["Shows basic understanding", "Clear communication"],
        weaknesses: ["Could be more detailed"]
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