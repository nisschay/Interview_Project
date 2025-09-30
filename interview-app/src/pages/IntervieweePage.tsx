import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Typography, Space, Alert, Row, Col } from 'antd';
import { MessageOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { 
  startInterview, 
  addMessage, 
  setParsedResumeData, 
  setJobDescription, 
  setInterviewConfig,
  setCurrentQuestion,
  setAllQuestions
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
    interviewType, 
    difficulty, 
    progress, 
    messages,
    parsedResumeData
  } = useSelector((state: RootState) => state.interview);

  const [resumeConfirmed, setResumeConfirmed] = useState(!!parsedResumeData);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState(15); // Default 15 minutes
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

  const predefinedPositions = {
    'data-scientist': {
      title: 'Data Scientist',
      description: `We are looking for a Data Scientist to join our team:
• 3+ years of experience in machine learning and data analysis
• Proficiency in Python, R, SQL, and data visualization tools
• Experience with ML frameworks (TensorFlow, PyTorch, Scikit-learn)
• Strong statistical analysis and hypothesis testing skills
• Experience with big data technologies (Spark, Hadoop)
• Knowledge of cloud platforms (AWS, GCP, Azure)
• Excellent problem-solving and communication skills`
    },
    'data-engineer': {
      title: 'Data Engineer',
      description: `We are seeking a Data Engineer with the following qualifications:
• 4+ years of experience in data engineering and ETL processes
• Expertise in SQL, Python, and data pipeline tools
• Experience with data warehousing (Snowflake, Redshift, BigQuery)
• Knowledge of streaming technologies (Kafka, Kinesis)
• Proficiency in cloud platforms and containerization
• Strong understanding of data modeling and architecture
• Experience with workflow orchestration tools (Airflow, Prefect)`
    },
    'frontend-dev': {
      title: 'Frontend Developer',
      description: `We are hiring a Frontend Developer with these skills:
• 3+ years of experience in modern frontend development
• Expertise in React, TypeScript, and modern JavaScript
• Experience with state management (Redux, Zustand)
• Knowledge of CSS frameworks and responsive design
• Familiarity with testing frameworks (Jest, Cypress)
• Understanding of build tools and CI/CD processes
• Strong UX/UI design sensibilities`
    },
    'backend-dev': {
      title: 'Backend Developer',
      description: `We are looking for a Backend Developer with:
• 4+ years of experience in server-side development
• Expertise in Node.js, Python, or Java
• Experience with databases (PostgreSQL, MongoDB)
• Knowledge of API design and microservices architecture
• Understanding of cloud services and containerization
• Experience with message queues and caching systems
• Strong knowledge of security best practices`
    },
    'ai-ml-engineer': {
      title: 'AI/ML Engineer',
      description: `We are seeking an AI/ML Engineer with:
• 3+ years of experience in AI/ML development and deployment
• Expertise in machine learning frameworks and MLOps
• Experience with deep learning and neural networks
• Knowledge of model optimization and deployment
• Proficiency in Python, TensorFlow, PyTorch
• Experience with cloud ML services (AWS SageMaker, GCP AI)
• Strong understanding of software engineering principles`
    }
  };

  const handleStartInterview = async () => {
    if (!selectedPosition || !resumeConfirmed || !parsedResumeData) {
      return;
    }
    
    const jobDesc = predefinedPositions[selectedPosition as keyof typeof predefinedPositions]?.description || '';
    dispatch(setJobDescription(jobDesc));
    
    setIsGeneratingQuestions(true);
    
    try {
      // Generate all questions upfront
      const questions: Array<{ id: string; question: string }> = [];
      
      for (let i = 1; i <= progress.totalQuestions; i++) {
        const response = await aiService.generateQuestion(
          parsedResumeData?.rawText || null,
          jobDesc,
          interviewType,
          difficulty,
          questions.map(q => q.question),
          i
        );
        
        questions.push({
          id: `q${i}-${Date.now()}`,
          question: response.content
        });
      }
      
      // Store all questions in Redux
      dispatch(setAllQuestions(questions));
      
      // Start the interview with the time limit
      dispatch(setInterviewConfig({
        type: interviewType,
        difficulty,
        totalQuestions: progress.totalQuestions,
        timeLimit
      }));
      
      dispatch(startInterview());
      
      // Add welcome message
      dispatch(addMessage({
        type: 'ai',
        content: `🎯 **Welcome to your ${interviewType} interview!**\n\nYou have ${timeLimit} minutes to answer ${progress.totalQuestions} questions.\n\n${parsedResumeData ? `I've analyzed your resume and generated personalized questions. ` : ''}You can see all questions in the sidebar and navigate between them.\n\n**Good luck!**`
      }));
      
      // Set the first question as current
      if (questions.length > 0) {
        dispatch(setCurrentQuestion({
          question: questions[0].question
        }));
      }
      
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to default questions
      const fallbackQuestions = getFallbackQuestions(interviewType, progress.totalQuestions);
      dispatch(setAllQuestions(fallbackQuestions));
      
      dispatch(startInterview());
      
      dispatch(addMessage({
        type: 'ai',
        content: `🎯 **Welcome to your ${interviewType} interview!**\n\nYou have ${timeLimit} minutes to answer ${progress.totalQuestions} questions.\n\nYou can see all questions in the sidebar and navigate between them.\n\n**Good luck!**`
      }));
      
      if (fallbackQuestions.length > 0) {
        dispatch(setCurrentQuestion({
          question: fallbackQuestions[0].question
        }));
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const getFallbackQuestions = (type: string, count: number): Array<{ id: string; question: string }> => {
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
      question: q
    }));
  };

  const handleConfigChange = (field: string, value: any) => {
    const config = {
      type: interviewType,
      difficulty,
      totalQuestions: progress.totalQuestions
    };
    
    if (field === 'type') config.type = value;
    if (field === 'difficulty') config.difficulty = value;
    if (field === 'totalQuestions') config.totalQuestions = value;
    
    dispatch(setInterviewConfig(config));
  };

  const handleResumeConfirm = (data: ParsedResumeData) => {
    console.log('✅ handleResumeConfirm called with:', data);
    dispatch(setParsedResumeData(data));
    setResumeConfirmed(true);
    console.log('✅ Resume confirmed, state should be:', { 
      resumeConfirmed: true, 
      hasData: !!data 
    });
  };

  const canStart = selectedPosition && resumeConfirmed && parsedResumeData;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 State check:', {
      selectedPosition,
      resumeConfirmed,
      hasParseData: !!parsedResumeData,
      parsedResumeDataName: parsedResumeData?.name,
      canStart
    });
  }, [selectedPosition, resumeConfirmed, parsedResumeData, canStart]);

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

      {/* Configuration Grid */}
      <Row gutter={24} justify="center">
        {/* Interview Settings */}
        <Col xs={24} lg={8}>
          <Card 
            title="🎯 Interview Configuration" 
            hoverable
            style={{ 
              minHeight: '460px', 
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
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Interview Type</Text>
                <Select
                  value={interviewType}
                  onChange={(value) => handleConfigChange('type', value)}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value="technical">🔧 Technical Interview</Option>
                  <Option value="behavioral">🧠 Behavioral Interview</Option>
                  <Option value="mixed">🎯 Mixed Interview</Option>
                </Select>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {interviewType === 'technical' && 'Focus on programming skills and technical knowledge'}
                  {interviewType === 'behavioral' && 'Focus on soft skills and past experiences'}
                  {interviewType === 'mixed' && 'Combination of technical and behavioral questions'}
                </Text>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Difficulty Level</Text>
                <Select
                  value={difficulty}
                  onChange={(value) => handleConfigChange('difficulty', value)}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value="junior">🌱 Junior Level</Option>
                  <Option value="mid">🚀 Mid Level</Option>
                  <Option value="senior">👑 Senior Level</Option>
                </Select>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {difficulty === 'junior' && 'Entry-level questions, 20s per question'}
                  {difficulty === 'mid' && 'Intermediate questions, 60s per question'}
                  {difficulty === 'senior' && 'Advanced questions, 120s per question'}
                </Text>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Number of Questions</Text>
                <Select
                  value={progress.totalQuestions}
                  onChange={(value) => handleConfigChange('totalQuestions', value)}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value={5}>5 Questions</Option>
                  <Option value={10}>10 Questions</Option>
                  <Option value={15}>15 Questions</Option>
                  <Option value={20}>20 Questions</Option>
                </Select>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Interview Time Limit</Text>
                <Select
                  value={timeLimit}
                  onChange={(value) => setTimeLimit(value)}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value={5}>5 minutes (Quick test)</Option>
                  <Option value={10}>10 minutes</Option>
                  <Option value={15}>15 minutes (Recommended)</Option>
                  <Option value={20}>20 minutes</Option>
                  <Option value={30}>30 minutes</Option>
                  <Option value={45}>45 minutes</Option>
                  <Option value={60}>60 minutes</Option>
                </Select>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Total time for all questions
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Resume Upload */}
        <Col xs={24} lg={8}>
          <Card 
            title="📄 Resume Upload (Required)" 
            hoverable
            style={{ 
              minHeight: '460px', 
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

        {/* Position Selection */}
        <Col xs={24} lg={8}>
          <Card 
            title="💼 Select Position" 
            hoverable
            style={{ 
              minHeight: '460px', 
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
                <Text strong style={{ display: 'block', marginBottom: '12px' }}>Choose the position you're applying for:</Text>
                <Select
                  value={selectedPosition}
                  onChange={setSelectedPosition}
                  placeholder="Select a position"
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value="data-scientist">🧠 Data Scientist</Option>
                  <Option value="data-engineer">🔧 Data Engineer</Option>
                  <Option value="frontend-dev">🎨 Frontend Developer</Option>
                  <Option value="backend-dev">⚙️ Backend Developer</Option>
                  <Option value="ai-ml-engineer">🤖 AI/ML Engineer</Option>
                </Select>
              </div>
              
              {selectedPosition && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Position Details:</Text>
                  <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
                    <Title level={5} style={{ margin: '0 0 12px 0' }}>
                      {predefinedPositions[selectedPosition as keyof typeof predefinedPositions]?.title}
                    </Title>
                    <Text style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                      {predefinedPositions[selectedPosition as keyof typeof predefinedPositions]?.description}
                    </Text>
                  </Card>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Validation Messages */}
      <Row justify="center">
        <Col xs={24} lg={16}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {!selectedPosition && (
              <Alert
                message="Position selection is required"
                description="Please select the position you're applying for to generate relevant interview questions."
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
            {selectedPosition && parsedResumeData && resumeConfirmed && (
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