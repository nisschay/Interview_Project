export interface AIResponse {
  content: string;
  confidence: number;
  suggestions?: string[];
}

class GeminiAIService {
  private apiKey: string = '';
  private model: string = 'gemini-2.5-flash-exp';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    // Safely load API key (browser-safe). Prefer server-side usage; frontend will usually run with mock responses.
    let key = '';
    try {
      // Vite style env (never expose real prod key in frontend!)
      // import.meta is a special syntax; guard with typeof to avoid ReferenceError in some build tools
      if (typeof import.meta !== 'undefined') {
        const anyImport: any = (import.meta as any);
        key = anyImport?.env?.VITE_GEMINI_API_KEY || '';
      }
    } catch {}
    try {
      // Node / SSR fallback (still avoid bundling actual key in client bundle)
      if (!key && typeof process !== 'undefined' && (process as any).env) {
        key = (process as any).env.GEMINI_API_KEY || '';
      }
    } catch {}
    this.apiKey = key;
    if (!this.apiKey) {
      console.warn('⚠️  No Gemini API key available on client. Using mock AI responses. (Set VITE_GEMINI_API_KEY for local testing only)');
    } else {
      console.log('🔐 Gemini API key loaded (client-side use not recommended for production).');
    }
    console.log('🤖 AI Service initialized');
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

    const request = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 1.0 + (Math.random() * 0.3), // 1.0-1.3 for maximum variety and uniqueness
        topK: 50, // Increased from 40 for more variety
        topP: 0.98, // Increased from 0.95 for more randomness
        maxOutputTokens: 2048,
      }
    };    try {
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
    // Role-aware fallback questions with CODING emphasis
    if (prompt.toLowerCase().includes('data scientist') || prompt.toLowerCase().includes('data-scientist')) {
      const dataScientistQuestions = [
        "Write Python code to calculate the Pearson correlation coefficient between two arrays. Explain what values indicate strong vs weak correlation.",
        "Implement a function to perform train-test split on a dataset. The function should take a dataset and test_size as input and return train and test sets.",
        "Code a function to handle missing data: implement mean imputation for numerical columns and mode imputation for categorical columns.",
        "Write code to calculate precision, recall, and F1-score given true labels and predicted labels arrays.",
        "Implement k-fold cross-validation from scratch. Your function should split data into k folds and return average validation score.",
        "Code a function to normalize features using min-max scaling. Show the formula and implementation.",
        "Write code to detect and remove outliers using the IQR (Interquartile Range) method.",
        "Implement one-hot encoding from scratch without using sklearn. Handle multiple categorical columns."
      ];
      return dataScientistQuestions[Math.floor(Math.random() * dataScientistQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('data engineer') || prompt.toLowerCase().includes('data-engineer')) {
      const dataEngineerQuestions = [
        "Write a SQL query to find duplicate records in a user table based on email address. Show email and count of duplicates, ordered by count descending.",
        "Code a Python function to validate CSV data schema: check for required columns, data types, and null constraints. Return a list of validation errors.",
        "Write a SQL query using window functions to calculate running total of sales per product over time.",
        "Implement a Python class for an ETL pipeline: include methods for extract (read CSV), transform (clean data), and load (write to database).",
        "Write a SQL query to implement slowly changing dimension (SCD) Type 2: track historical changes with start_date, end_date, and is_current flag.",
        "Code a function to read a large Parquet file in chunks and apply transformations without loading entire file into memory.",
        "Write SQL to pivot data: convert rows to columns for monthly sales data (columns should be Jan, Feb, Mar, etc.).",
        "Implement a data quality check function: validate record counts, check for null values, verify referential integrity."
      ];
      return dataEngineerQuestions[Math.floor(Math.random() * dataEngineerQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('ai') || prompt.toLowerCase().includes('ml engineer')) {
      const aiMlQuestions = [
        "Implement a simple perceptron from scratch in Python: include forward pass, activation function, and weight update logic using gradient descent.",
        "Code the sigmoid activation function and its derivative. Explain why the derivative is important for backpropagation.",
        "Write code to implement batch normalization for a neural network layer. Include both forward and backward pass logic.",
        "Implement the ReLU activation function and Leaky ReLU variant. Compare their advantages and disadvantages.",
        "Code a simple CNN architecture for MNIST digit classification using PyTorch or TensorFlow. Include convolutional layers, pooling, and fully connected layers.",
        "Implement dropout regularization from scratch. Show how it works differently during training vs inference.",
        "Write code for the scaled dot-product attention mechanism. Include the formula and explain each component.",
        "Implement early stopping logic for training: monitor validation loss, save best model, and stop if no improvement for N epochs."
      ];
      return aiMlQuestions[Math.floor(Math.random() * aiMlQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('frontend')) {
      const frontendQuestions = [
        "Implement a debounce function from scratch in JavaScript. Your function should delay execution until after a specified wait time has passed since the last call.",
        "Create a custom React hook called useLocalStorage that syncs component state with localStorage. Include get, set, and remove functionality.",
        "Write code to implement deep cloning of nested objects in JavaScript without using external libraries. Handle arrays, objects, and primitive types.",
        "Implement a function to flatten a deeply nested array. For example: [1, [2, [3, [4]]]] should become [1, 2, 3, 4].",
        "Code a custom useDebounce hook in React that debounces a value. The hook should update the debounced value after a specified delay.",
        "Implement a simple event emitter class: include methods for on (subscribe), off (unsubscribe), and emit (trigger events).",
        "Write a function to implement memoization for expensive function calls. The function should cache results based on input arguments.",
        "Code a virtual DOM diffing algorithm (simplified version): compare two DOM trees and return the minimal set of changes needed."
      ];
      return frontendQuestions[Math.floor(Math.random() * frontendQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('backend')) {
      const backendQuestions = [
        "Implement a singly linked list class with methods for: insert (at beginning/end), delete (by value), search, and display. Use your preferred language.",
        "Code a LRU (Least Recently Used) Cache with get and put operations that both run in O(1) time complexity. Explain your data structure choice.",
        "Write a function to detect if a linked list has a cycle. Return true if cycle exists, false otherwise. Can you solve it in O(1) space?",
        "Implement a Hash Map from scratch using an array and hash function. Include methods for set, get, and delete with collision handling.",
        "Code a function to reverse a linked list iteratively. Then solve it recursively. Compare the space complexity of both approaches.",
        "Implement a Queue using two Stacks. Include enqueue and dequeue operations and explain the time complexity.",
        "Write code to find the middle element of a linked list in one pass (without counting length first). Use the slow and fast pointer technique.",
        "Implement merge sort for a linked list. Your code should sort the list in O(n log n) time without using extra space for an array."
      ];
      return backendQuestions[Math.floor(Math.random() * backendQuestions.length)];
    }
    
    if (prompt.toLowerCase().includes('devops')) {
      const devopsQuestions = [
        "Write a Bash script to monitor system health: check CPU usage, memory usage, and disk space. Send alert if any metric exceeds 80%.",
        "Code a Python script to automate Docker container deployment: pull image, stop old container, start new container, run health checks.",
        "Implement a log parsing script in Python: read application logs, extract error messages, group by error type, and generate summary report.",
        "Write a script to backup a PostgreSQL database, compress it, upload to S3, and verify the backup integrity.",
        "Code a monitoring script that collects metrics (CPU, memory, disk I/O) and sends them to Prometheus in the correct format.",
        "Implement a blue-green deployment script: create new infrastructure, run tests, switch traffic, keep old version for quick rollback.",
        "Write a script to scan Docker images for vulnerabilities, generate a report, and fail the pipeline if critical issues are found.",
        "Code a Kubernetes health check endpoint in your preferred language: check database connection, Redis connection, and third-party API availability."
      ];
      return devopsQuestions[Math.floor(Math.random() * devopsQuestions.length)];
    }
    
    // Generic fallback with coding emphasis
    const technicalQuestions = [
      "Implement a function to reverse a string in your preferred programming language. Can you do it in-place?",
      "Write code to find the second largest element in an array without sorting the entire array.",
      "Implement a function to check if a string is a palindrome. Ignore spaces and punctuation.",
      "Code a function to find all duplicate elements in an array. Return them in a new array.",
      "Write a function to merge two sorted arrays into one sorted array without using extra space.",
      "Implement a basic calculator that can handle addition, subtraction, multiplication, and division with proper operator precedence."
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