import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Typography, Space, Alert, Row, Col } from 'antd';
import { MessageOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import {
  startInterview,
  setInterviewConfig,
  setCurrentQuestion,
  setAllQuestions,
  setParsedResumeData
} from '../store/slices/interviewSlice';
import ChatInterface from '../components/Chat/ChatInterface';
import ResumeUploader from '../components/ResumeParser/ResumeUploader';
import aiService from '../services/aiService';
import type { ParsedResumeData } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const IntervieweePage: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    isActive, 
    progress, 
    messages,
    parsedResumeData
  } = useSelector((state: RootState) => state.interview);

  const [resumeConfirmed, setResumeConfirmed] = useState(!!parsedResumeData);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Sync resumeConfirmed when parsedResumeData changes
  useEffect(() => {
    if (parsedResumeData && !resumeConfirmed) {
      setResumeConfirmed(true);
    } else if (!parsedResumeData && resumeConfirmed) {
      setResumeConfirmed(false);
    }
  }, [parsedResumeData]);

  // Check for unfinished session on mount
  useEffect(() => {
    if (!isActive && messages.length > 0 && !progress.isCompleted) {
      setShowWelcomeBack(true);
    }
  }, []);

  const roleOptions = [
    { value: 'data-scientist', label: '🧠 Data Scientist' },
    { value: 'data-engineer', label: '🔧 Data Engineer' },
    { value: 'frontend-developer', label: '🎨 Frontend Developer' },
    { value: 'backend-developer', label: '⚙️ Backend Developer' },
    { value: 'fullstack-developer', label: '🚀 Full Stack Developer' },
    { value: 'ai-ml-engineer', label: '🤖 AI/ML Engineer' },
    { value: 'devops-engineer', label: '🔨 DevOps Engineer' },
    { value: 'product-manager', label: '📊 Product Manager' },
  ];

  const levelDescriptions = {
    junior: 'Entry-level position (0-2 years experience)',
    mid: 'Mid-level position (2-5 years experience)',
    senior: 'Senior-level position (5+ years experience)'
  };

  const handleStartInterview = async () => {
    if (!selectedRole || !resumeConfirmed || !parsedResumeData) {
      return;
    }
    
    setIsGeneratingQuestions(true);
    
    try {
      // Define question distribution: 4 easy, 4 medium, 2 hard
      const questionConfig = [
        { difficulty: 'easy', count: 4, timePerQuestion: 3 },
        { difficulty: 'medium', count: 4, timePerQuestion: 4 },
        { difficulty: 'hard', count: 2, timePerQuestion: 5 }
      ];
      
      // Calculate total time: (4*3) + (4*4) + (2*5) = 12 + 16 + 10 = 38 minutes
      const totalTimeMinutes = questionConfig.reduce(
        (sum, config) => sum + (config.count * config.timePerQuestion), 
        0
      );
      
      const questions: Array<{ id: string; question: string; difficulty: string; timeLimit: number }> = [];
      
      // Generate questions for each difficulty level
      for (const config of questionConfig) {
        for (let i = 0; i < config.count; i++) {
          const roleLabel = roleOptions.find(r => r.value === selectedRole)?.label || selectedRole;
          const avoidedTopics = questions.map(q => q.question.substring(0, 60)).join(' | ');
          const questionNumber = questions.length + 1;
          
          // Role-specific question domains with EXAMPLES
          const roleDomains: Record<string, string> = {
            'data-scientist': `Machine Learning & Statistics ONLY:
- Supervised/unsupervised learning algorithms
- Statistical analysis, hypothesis testing, A/B testing
- Feature engineering and selection
- Model evaluation metrics (precision, recall, F1, AUC-ROC)
- Data preprocessing and cleaning with Python/R
- Data visualization (matplotlib, seaborn, ggplot)
- Exploratory Data Analysis (EDA)
NO web development, NO APIs, NO React/frontend`,
            'data-engineer': `Data Engineering & Pipelines ONLY:
- ETL/ELT pipeline design and implementation
- SQL query optimization and database design
- Apache Spark, Hadoop, distributed systems
- Data warehousing (Snowflake, Redshift, BigQuery)
- Data modeling (star schema, normalization)
- Cloud platforms (AWS S3, GCP, Azure)
- Data quality and validation
NO machine learning, NO web development`,
            'frontend-developer': `Frontend Development ONLY:
- HTML5, CSS3, JavaScript/TypeScript
- React, Vue, Angular frameworks
- Responsive design, CSS Grid/Flexbox
- Browser APIs, DOM manipulation
- Performance optimization, lazy loading
- Accessibility (WCAG, ARIA)
- State management, component architecture
NO backend/databases, NO ML/data science`,
            'backend-developer': `Backend Development ONLY:
- Server-side programming (Node.js, Python, Java)
- RESTful APIs, GraphQL design
- Database design (SQL/NoSQL)
- Authentication, authorization, security
- Caching strategies (Redis, Memcached)
- Microservices architecture
- API optimization and scalability
NO frontend frameworks, NO ML/data science`,
            'fullstack-developer': `Full-Stack Development:
- Frontend: React/Vue + responsive design
- Backend: APIs, databases, authentication
- Integration: frontend-backend communication
- Deployment, CI/CD basics
- Database design and optimization
- Security best practices`,
            'ai-ml-engineer': `AI/ML Engineering ONLY:
- Deep learning architectures (CNNs, RNNs, Transformers)
- Neural network training, backpropagation
- TensorFlow, PyTorch, Keras
- MLOps, model deployment, monitoring
- NLP (text processing, embeddings, LLMs)
- Computer Vision (image classification, object detection)
- Transfer learning, fine-tuning
NO web development, NO basic statistics`,
            'devops-engineer': `DevOps & Infrastructure ONLY:
- CI/CD pipelines (Jenkins, GitHub Actions)
- Docker, Kubernetes, containerization
- Cloud infrastructure (AWS, GCP, Azure)
- Infrastructure as Code (Terraform, CloudFormation)
- Monitoring, logging (Prometheus, ELK)
- Security, compliance, automation
NO application development, NO ML`,
            'product-manager': `Product Management ONLY:
- Product strategy and vision
- User stories, requirements gathering
- Roadmap planning and prioritization
- Stakeholder communication
- Metrics, KPIs, analytics
- A/B testing, user research
NO technical implementation`
          };

          const levelGuidance: Record<string, string> = {
            'junior': `JUNIOR Level Requirements:
✓ ASK: Fundamental concepts, definitions, basic tools
✓ ASK: "What is X?", "Explain the difference between X and Y", "How does X work?"
✓ ASK: Basic syntax, core principles, foundational knowledge
✗ DON'T ASK: System design, architecture, scaling, optimization
✗ DON'T ASK: Leadership, team management, strategic decisions
✗ DON'T ASK: Complex algorithms, advanced patterns`,
            'mid': `MID-LEVEL Requirements:
✓ ASK: Practical implementation, real-world scenarios
✓ ASK: "How would you implement X?", "Compare X vs Y for scenario Z"
✓ ASK: Problem-solving, trade-offs, best practices
✓ ASK: Component-level design, optimization basics
✗ DON'T ASK: Only definitions (too basic)
✗ DON'T ASK: Enterprise architecture (too advanced)
✗ DON'T ASK: Basic syntax questions`,
            'senior': `SENIOR Level Requirements:
✓ ASK: System design, architecture, scalability
✓ ASK: "Design a system that...", "How would you scale X to handle Y users?"
✓ ASK: Leadership, mentoring, strategic technical decisions
✓ ASK: Performance optimization, distributed systems
✓ ASK: Trade-offs between different architectural patterns
✗ DON'T ASK: Basic concepts or definitions
✗ DON'T ASK: Simple implementation questions`
          };
          
          const prompt = `You are an EXPERT TECHNICAL INTERVIEWER specializing in ${roleLabel.toUpperCase()} positions.

🎯 GENERATE ONE UNIQUE QUESTION FOR:
ROLE: ${selectedLevel.toUpperCase()} ${roleLabel.toUpperCase()}
DIFFICULTY: ${config.difficulty.toUpperCase()}
QUESTION NUMBER: ${questionNumber}/10

📋 ALLOWED TOPICS (STICK TO THESE ONLY):
${roleDomains[selectedRole]}

${levelGuidance[selectedLevel]}

🚫 ABSOLUTELY FORBIDDEN TOPICS:
${selectedRole === 'data-scientist' || selectedRole === 'data-engineer' ? 
'- NO React, Vue, Angular, frontend frameworks\n- NO HTML/CSS/JavaScript web development\n- NO RESTful APIs, web services\n- NO UI/UX, responsive design' :
selectedRole === 'frontend-developer' || selectedRole === 'backend-developer' ?
'- NO machine learning algorithms\n- NO data science, statistics, EDA\n- NO deep learning, neural networks\n- NO data visualization libraries' :
'- NO topics outside the role scope'}

📚 ALREADY ASKED (MUST BE COMPLETELY DIFFERENT):
${avoidedTopics || 'None - this is question 1'}

💡 DIFFICULTY LEVEL GUIDE:
EASY = ${config.difficulty === 'easy' ? '✓ Definitions, basic concepts, "What is...?"' : '✗ Too basic'}
MEDIUM = ${config.difficulty === 'medium' ? '✓ Implementation, "How would you...", scenarios' : config.difficulty === 'easy' ? '✗ Too complex' : '✗ Too simple'}
HARD = ${config.difficulty === 'hard' ? '✓ System design, architecture, "Design a scalable..."' : '✗ Too advanced'}

⚡ CRITICAL RULES:
1. Question MUST be ${config.difficulty} difficulty for ${selectedLevel} ${roleLabel}
2. Question MUST use ONLY allowed topics from the list above
3. Question MUST be UNIQUE (different from already asked)
4. Question MUST NOT use forbidden topics
5. If Data Scientist/Engineer: ONLY ML/data topics, NO web dev
6. If Frontend/Backend: ONLY web dev topics, NO ML/data science

✅ GOOD EXAMPLES:
${selectedRole === 'data-scientist' && selectedLevel === 'junior' && config.difficulty === 'easy' ? 
'- "What is the difference between supervised and unsupervised learning?"\n- "Explain what a confusion matrix is and how to interpret it."' :
selectedRole === 'data-scientist' && selectedLevel === 'mid' && config.difficulty === 'medium' ?
'- "How would you handle missing data in a dataset? Explain different imputation techniques."\n- "Explain the bias-variance tradeoff and how it affects model performance."' :
selectedRole === 'ai-ml-engineer' && selectedLevel === 'mid' && config.difficulty === 'hard' ?
'- "Design a neural network architecture for image classification. Explain your choice of layers."\n- "How would you prevent overfitting in a deep learning model? Discuss multiple techniques."' :
'See role-specific domains above'}

❌ BAD EXAMPLES (NEVER ASK THESE):
${selectedRole === 'data-scientist' || selectedRole === 'data-engineer' ?
'- "What is a RESTful API?" (WEB DEV - FORBIDDEN!)\n- "How does React state management work?" (FRONTEND - FORBIDDEN!)\n- "Explain CSS flexbox" (WEB DEV - FORBIDDEN!)' :
'- "What is a neural network?" (ML - FORBIDDEN FOR WEB DEVS!)\n- "Explain gradient descent" (DATA SCIENCE - FORBIDDEN!)'}

📤 OUTPUT FORMAT:
Return ONLY the question text. No explanations. No preamble. Just the question.`;

          const response = await aiService.generateQuestion(
            parsedResumeData?.rawText || null,
            prompt,
            'mixed',
            config.difficulty as any,
            questions.map(q => q.question),
            questions.length + 1
          );
          
          questions.push({
            id: `q${questions.length + 1}-${Date.now()}-${Math.random()}`,
            question: response.content,
            difficulty: config.difficulty,
            timeLimit: config.timePerQuestion * 60 // Convert to seconds
          });
        }
      }
      
      // Shuffle questions to mix difficulties
      const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
      
      // Store all questions in Redux
      dispatch(setAllQuestions(shuffledQuestions));
      
      // Start the interview with calculated time limit
      dispatch(setInterviewConfig({
        type: 'mixed',
        difficulty: selectedLevel,
        totalQuestions: 10,
        timeLimit: totalTimeMinutes
      }));
      
      dispatch(startInterview());
      
      // Don't add welcome message in chat - it's in the sidebar now
      
      // Set the first question as current
      if (shuffledQuestions.length > 0) {
        dispatch(setCurrentQuestion({
          question: shuffledQuestions[0].question
        }));
      }
      
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to default questions
      const fallbackQuestions = getFallbackQuestions('mixed', 10);
      dispatch(setAllQuestions(fallbackQuestions));
      
      dispatch(setInterviewConfig({
        type: 'mixed',
        difficulty: selectedLevel,
        totalQuestions: 10,
        timeLimit: 38
      }));
      
      dispatch(startInterview());
      
      if (fallbackQuestions.length > 0) {
        dispatch(setCurrentQuestion({
          question: fallbackQuestions[0].question
        }));
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const getFallbackQuestions = (type: string, count: number): Array<{ id: string; question: string; difficulty: string; timeLimit: number }> => {
    const fallbacks = {
      technical: [
        "Can you explain your experience with JavaScript and any frameworks you've used?",
        "How do you approach debugging when you encounter a problem in your code?",
        "What's your experience with databases and how do you optimize queries?",
        "Describe a challenging technical problem you solved recently.",
        "How do you ensure code quality and what testing practices do you follow?",
        "What's your experience with version control systems like Git?",
        "How do you stay updated with the latest technology trends?",
        "Can you explain the concept of RESTful APIs?",
        "What's your approach to learning a new programming language or framework?",
        "Describe your experience with cloud platforms like AWS or Azure."
      ],
      behavioral: [
        "Tell me about yourself and your career journey.",
        "Describe a time when you had to work with a difficult team member.",
        "How do you handle stress and pressure in the workplace?",
        "Tell me about a time when you failed and what you learned from it.",
        "How do you prioritize tasks when you have multiple deadlines?",
        "Describe a situation where you had to adapt to significant changes.",
        "Tell me about a time when you had to learn something new quickly.",
        "How do you handle constructive criticism?",
        "Describe a situation where you showed leadership.",
        "What motivates you in your professional life?"
      ],
      mixed: [
        "Tell me about a recent project you worked on and the technologies you used.",
        "How do you approach problem-solving in a team environment?",
        "Describe a technical challenge you faced and how you overcame it.",
        "How do you balance technical excellence with meeting deadlines?",
        "Tell me about a time when you had to explain a technical concept to a non-technical person.",
        "How do you handle disagreements about technical decisions?",
        "Describe your experience with agile development methodologies.",
        "How do you ensure your code is maintainable and scalable?",
        "Tell me about a time when you had to mentor someone.",
        "How do you approach continuous learning and skill development?"
      ]
    };
    
    const questionList = fallbacks[type as keyof typeof fallbacks] || fallbacks.technical;
    return questionList.slice(0, count).map((q, i) => ({
      id: `fallback-${i + 1}`,
      question: q,
      difficulty: i < 4 ? 'easy' : i < 8 ? 'medium' : 'hard',
      timeLimit: i < 4 ? 180 : i < 8 ? 240 : 300
    }));
  };

  // No longer needed - config is set automatically based on selections

  const handleResumeConfirm = (data: ParsedResumeData) => {
    console.log('✅ handleResumeConfirm called with:', data);
    dispatch(setParsedResumeData(data));
    setResumeConfirmed(true);
    console.log('✅ Resume confirmed, state should be:', { 
      resumeConfirmed: true, 
      hasData: !!data 
    });
  };

  const canStart = selectedRole && resumeConfirmed && parsedResumeData;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 State check:', {
      selectedRole,
      selectedLevel,
      resumeConfirmed,
      hasParseData: !!parsedResumeData,
      parsedResumeDataName: parsedResumeData?.name,
      canStart
    });
  }, [selectedRole, selectedLevel, resumeConfirmed, parsedResumeData, canStart]);

  // Active Interview Interface
  if (isActive) {
    return (
      <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Main Interview Area - Full Width */}
        <ChatInterface />
      </div>
    );
  }

  // Interview Setup Interface
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px',
      gap: '20px',
      minHeight: '100%',
      width: '100%',
      boxSizing: 'border-box',
      background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '32px 40px',
        borderRadius: '16px',
        marginBottom: '16px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Title level={1} style={{ 
            color: 'white', 
            margin: 0, 
            marginBottom: '8px',
            fontSize: '2rem',
            fontWeight: 700
          }}>
            <MessageOutlined style={{ marginRight: '16px' }} />
            AI Technical Interview Platform
          </Title>
          <Text style={{ 
            color: 'rgba(255,255,255,0.95)', 
            fontSize: '16px',
            fontWeight: 500
          }}>
            Configure your interview settings and get ready for an AI-powered assessment
          </Text>
          {/* Debug: Clear state button */}
          <div style={{ marginTop: '12px' }}>
            <Button 
              size="small" 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{ fontSize: '11px' }}
            >
              🔄 Clear Cache & Reload
            </Button>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
      </div>

      {/* Welcome Back Modal */}
      {showWelcomeBack && (
        <Alert
          message="Welcome Back!"
          description="You have an unfinished interview session. Would you like to continue where you left off?"
          type="info"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={() => setShowWelcomeBack(false)}>
                Start New
              </Button>
              <Button 
                type="primary" 
                size="small" 
                onClick={() => {
                  setShowWelcomeBack(false);
                  // Resume logic would go here
                }}
              >
                Continue
              </Button>
            </Space>
          }
          closable
          onClose={() => setShowWelcomeBack(false)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Configuration Grid - Landscape Layout */}
      <Row gutter={24} justify="center">
        {/* Combined Position & Level Selection */}
        <Col xs={24} lg={12}>
          <Card 
            title="💼 Position & Experience Level" 
            hoverable
            style={{ 
              minHeight: '350px', 
              marginBottom: '16px',
              borderRadius: '16px',
              border: '2px solid #f0f0f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease'
            }}
            headStyle={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '14px 14px 0 0', fontSize: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ display: 'block', marginBottom: '12px' }}>Experience Level</Text>
                <Select
                  value={selectedLevel}
                  onChange={setSelectedLevel}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value="junior">🌱 Junior (0-2 years)</Option>
                  <Option value="mid">🚀 Mid-Level (2-5 years)</Option>
                  <Option value="senior">👑 Senior (5+ years)</Option>
                </Select>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {levelDescriptions[selectedLevel]}
                </Text>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: '12px' }}>Role/Position</Text>
                <Select
                  value={selectedRole}
                  onChange={setSelectedRole}
                  placeholder="Select your target role"
                  style={{ width: '100%' }}
                  size="large"
                  showSearch
                  filterOption={(input, option) => {
                    const children = option?.children;
                    if (Array.isArray(children)) {
                      const text = children.join('');
                      return text.toLowerCase().includes(input.toLowerCase());
                    }
                    return String(children || '').toLowerCase().includes(input.toLowerCase());
                  }}
                >
                  {roleOptions.map(role => (
                    <Option key={role.value} value={role.value}>
                      {role.label}
                    </Option>
                  ))}
                </Select>
              </div>
              
              {selectedRole && selectedLevel && (
                <Alert
                  message="Interview Configuration"
                  description={
                    <div>
                      <Text>You will be interviewed for:</Text>
                      <br />
                      <Text strong style={{ fontSize: '15px' }}>
                        {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} {roleOptions.find(r => r.value === selectedRole)?.label}
                      </Text>
                      <br />
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        • 10 Mixed Questions (Technical + Behavioral)<br />
                        • 4 Easy (3 min each), 4 Medium (4 min each), 2 Hard (5 min each)<br />
                        • Total Time: 38 minutes
                      </Text>
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<MessageOutlined />}
                />
              )}
            </Space>
          </Card>
        </Col>

        {/* Resume Upload */}
        <Col xs={24} lg={12}>
          <Card 
            title="� Resume Upload (Required)" 
            hoverable
            style={{ 
              minHeight: '350px', 
              marginBottom: '16px',
              borderRadius: '16px',
              border: '2px solid #f0f0f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease'
            }}
            headStyle={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '14px 14px 0 0', fontSize: '16px' }}
          >
            <ResumeUploader
              onResult={(data) => {
                if (data) {
                  dispatch(setParsedResumeData(data));
                } else {
                  dispatch(setParsedResumeData(null as any));
                  setResumeConfirmed(false);
                }
              }}
              onConfirm={handleResumeConfirm}
            />
          </Card>
        </Col>
      </Row>

      {/* Validation Messages */}
      <Row justify="center">
        <Col xs={24} lg={16}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {!selectedRole && (
              <Alert
                message="Role selection is required"
                description="Please select the role you're applying for to generate relevant interview questions."
                type="warning"
                showIcon
              />
            )}

            {!parsedResumeData && (
              <Alert
                message="Resume upload is required"
                description="Please upload your resume to proceed with the interview."
                type="error"
                showIcon
              />
            )}

            {parsedResumeData && !resumeConfirmed && (
              <Alert
                message="Please confirm your resume details"
                description="Review and confirm the parsed information from your resume before starting."
                type="info"
                showIcon
              />
            )}
            
            {/* Success message when all requirements are met */}
            {selectedRole && parsedResumeData && resumeConfirmed && (
              <Alert
                message="All requirements completed!"
                description="You're all set. Click the button below to start your interview."
                type="success"
                showIcon
              />
            )}
          </Space>
        </Col>
      </Row>

      {/* Start Button */}
      <Row justify="center">
        <Col>
          <Button
            type="primary"
            size="large"
            icon={isGeneratingQuestions ? <ClockCircleOutlined spin /> : <PlayCircleOutlined />}
            onClick={handleStartInterview}
            disabled={!canStart || isGeneratingQuestions}
            loading={isGeneratingQuestions}
            style={{ 
              height: '64px',
              fontSize: '18px',
              fontWeight: '700',
              paddingLeft: '48px',
              paddingRight: '48px',
              borderRadius: '16px',
              background: canStart && !isGeneratingQuestions
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#d9d9d9',
              border: 'none',
              boxShadow: canStart && !isGeneratingQuestions
                ? '0 8px 24px rgba(102, 126, 234, 0.5)' 
                : 'none',
              transition: 'all 0.3s ease',
              cursor: canStart && !isGeneratingQuestions ? 'pointer' : 'not-allowed'
            }}
          >
            {isGeneratingQuestions ? '🔄 Generating Questions...' : '🚀 ' + (canStart ? 'Start Interview Now' : 'Complete All Requirements Above')}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default IntervieweePage;