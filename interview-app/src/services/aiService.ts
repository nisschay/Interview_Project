export interface AIResponse {
  content: string;
  confidence: number;
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
    // TO SET YOUR API KEY: 
    // NOTE: This project expects the production/backend to provide the Gemini API key.
    // The key below is embedded for server-side usage in this environment.
    // Do NOT prompt users for API keys in the client UI.
    this.apiKey = 'AIzaSyDjEV3JYsJmZ7H6QTao3OoGVE0ISm-yAJU';
  }

  setModel(model: string) {
    this.model = model;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      console.warn('⚠️  No Gemini API key set. Using mock responses. Set your key with: aiService.setApiKey("your-key")');
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getMockResponse(prompt);
    }
  }

  private getMockResponse(prompt: string): string {
    const mockQuestions = [
      "What is the difference between var, let, and const in JavaScript?",
      "Explain the concept of closures in JavaScript with an example.",
      "How would you optimize a React application for better performance?",
      "What are the differences between SQL and NoSQL databases?",
      "Explain the concept of RESTful APIs and HTTP methods.",
      "How do you handle state management in large React applications?",
      "What is the difference between synchronous and asynchronous programming?",
      "Explain the concept of Big O notation with examples.",
      "How would you implement authentication in a web application?",
      "What are the principles of clean code and how do you apply them?"
    ];

    const mockEvaluations = [
      "Score: 85\nFeedback: Good answer! You demonstrated a solid understanding of the concept. Your explanation was clear and well-structured.\nSuggestions:\n- Consider providing more specific examples\n- Elaborate on edge cases\n- Mention real-world applications",
      "Score: 78\nFeedback: Nice work! You covered the basics well and showed good problem-solving skills.\nSuggestions:\n- Add more technical depth\n- Explain your thought process more clearly\n- Consider alternative approaches",
      "Score: 92\nFeedback: Excellent explanation! Your answer shows deep knowledge and practical experience.\nSuggestions:\n- Maybe add some performance considerations\n- Discuss potential trade-offs\n- Include testing strategies"
    ];

    if (prompt.toLowerCase().includes('evaluate') || prompt.toLowerCase().includes('score')) {
      return mockEvaluations[Math.floor(Math.random() * mockEvaluations.length)];
    }
    return mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
  }

  async generateQuestion(
    resumeContent: string | null,
    jobDescription: string | null,
    interviewType: 'technical' | 'behavioral' | 'mixed',
    difficulty: 'junior' | 'mid' | 'senior',
    previousQuestions: string[] = []
  ): Promise<AIResponse> {
    const prompt = `
You are an expert technical interviewer. Generate a ${difficulty}-level ${interviewType} interview question.

Context:
- Resume: ${resumeContent || 'Not provided'}
- Job Description: ${jobDescription || 'General software development role'}
- Interview Type: ${interviewType}
- Difficulty: ${difficulty}
- Previous Questions: ${previousQuestions.join(', ') || 'None'}

Generate a thoughtful, relevant question that:
1. Matches the difficulty level
2. Is relevant to the job description
3. Hasn't been asked before
4. Encourages detailed responses

Return only the question, nothing else.`;

    try {
      const content = await this.callGeminiAPI(prompt);
      return {
        content: content.trim(),
        confidence: 0.9
      };
    } catch (error) {
      console.error('Error generating question:', error);
      return {
        content: "Can you tell me about your experience with software development and what technologies you've worked with?",
        confidence: 0.5
      };
    }
  }

  async evaluateAnswer(question: string, answer: string): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    const prompt = `
As an expert technical interviewer, evaluate this candidate's answer:

Question: ${question}
Answer: ${answer}

Provide:
1. A score from 1-100
2. Constructive feedback (2-3 sentences)
3. 2-3 specific suggestions for improvement

Format your response as:
Score: [number]
Feedback: [feedback text]
Suggestions: 
- [suggestion 1]
- [suggestion 2]
- [suggestion 3]`;

    try {
      const response = await this.callGeminiAPI(prompt);
      
      // Parse the response
      const scoreMatch = response.match(/Score:\s*(\d+)/);
      const feedbackMatch = response.match(/Feedback:\s*([^]*?)(?=Suggestions:|$)/);
      const suggestionsMatch = response.match(/Suggestions:\s*([^]*?)$/);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : "Good answer with room for improvement.";
      const suggestions = suggestionsMatch 
        ? suggestionsMatch[1].split('\n').filter(s => s.trim().startsWith('-')).map(s => s.replace(/^-\s*/, '').trim())
        : ["Provide more specific examples", "Explain the underlying concepts", "Consider edge cases"];

      return { score, feedback, suggestions };
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        score: 75,
        feedback: "Thank you for your response. Consider providing more detailed examples and explanations.",
        suggestions: ["Add more specific examples", "Explain your thought process", "Consider alternative approaches"]
      };
    }
  }

  async generateFollowUp(originalQuestion: string, answer: string): Promise<AIResponse> {
    const prompt = `
Based on this interview exchange, generate a relevant follow-up question:

Original Question: ${originalQuestion}
Candidate's Answer: ${answer}

Generate a follow-up question that:
1. Builds on their answer
2. Probes deeper into their understanding
3. Is natural and conversational
4. Maintains interview flow

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
        content: "Can you elaborate on that approach and explain how you would handle potential challenges?",
        confidence: 0.6
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