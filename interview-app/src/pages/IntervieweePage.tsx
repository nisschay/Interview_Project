import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Typography, Space, Alert, Row, Col, Progress, Tag, Statistic, Timeline } from 'antd';
import { MessageOutlined, PlayCircleOutlined, StopOutlined, CheckOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { 
  startInterview, 
  endInterview, 
  addMessage, 
  setParsedResumeData, 
  setJobDescription, 
  setInterviewConfig,
  setCurrentQuestion
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
    isPaused,
    interviewType, 
    difficulty, 
    progress, 
    messages,
    parsedResumeData,
    questionTimer
  } = useSelector((state: RootState) => state.interview);

  const [resumeConfirmed, setResumeConfirmed] = useState(!!parsedResumeData);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('');

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
    dispatch(startInterview());
    
    // Add welcome message
    dispatch(addMessage({
      type: 'ai',
      content: `🎯 **Welcome to your ${interviewType} interview!**\n\nI'm an AI interviewer and I'll be conducting a ${difficulty}-level interview with ${progress.totalQuestions} questions.\n\n${parsedResumeData ? `I've analyzed your resume and the job description. ` : ''}Let me start with your first question...`
    }));

    // Generate first question
    setTimeout(async () => {
      try {
        const response = await aiService.generateQuestion(
          parsedResumeData?.rawText || null,
          jobDesc,
          interviewType,
          difficulty,
          [],
          1
        );
        
        dispatch(addMessage({
          type: 'ai',
          content: response.content,
          questionNumber: 1
        }));
        
        // Activate timer for the question
        dispatch(setCurrentQuestion({
          question: response.content
        }));
      } catch (error) {
        console.error('Error generating first question:', error);
        const defaultQuestion = getDefaultFirstQuestion(interviewType);
        dispatch(addMessage({
          type: 'ai',
          content: defaultQuestion,
          questionNumber: 1
        }));
        
        // Activate timer for the question
        dispatch(setCurrentQuestion({
          question: defaultQuestion
        }));
      }
    }, 2000);
  };

  const getDefaultFirstQuestion = (type: string): string => {
    switch (type) {
      case 'technical':
        return "Let's start with the basics. Can you tell me about your experience with software development and the technologies you're most comfortable working with?";
      case 'behavioral':
        return "To begin, could you tell me about yourself and what motivated you to pursue a career in software development?";
      case 'mixed':
        return "Let's get started! Can you introduce yourself and tell me about a recent project you worked on that you're particularly proud of?";
      default:
        return "Let's begin the interview. Can you tell me about your background and experience?";
    }
  };

  const handleEndInterview = () => {
    dispatch(endInterview({}));
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
    const progressPercentage = Math.round((progress.questionsAsked / progress.totalQuestions) * 100);
    
    return (
      <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Status Header */}
        <Row gutter={24} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Status"
                value={isPaused ? "Paused" : "Active"}
                prefix={isPaused ? <ClockCircleOutlined /> : <CheckOutlined />}
                valueStyle={{ 
                  color: isPaused ? '#faad14' : '#52c41a',
                  fontSize: '20px'
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Progress"
                value={`${progress.questionsAsked}/${progress.totalQuestions}`}
                prefix={<MessageOutlined />}
                suffix={
                  <Progress
                    type="circle"
                    size={40}
                    percent={progressPercentage}
                    format={() => `${progressPercentage}%`}
                    strokeWidth={8}
                  />
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Average Score"
                value={progress.averageScore}
                prefix={<TrophyOutlined />}
                suffix="/100"
                valueStyle={{ 
                  color: progress.averageScore >= 80 ? '#52c41a' : 
                        progress.averageScore >= 60 ? '#faad14' : '#ff4d4f'
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Time Remaining"
                value={questionTimer.isActive ? `${Math.floor(questionTimer.timeRemaining / 60)}:${(questionTimer.timeRemaining % 60).toString().padStart(2, '0')}` : '--:--'}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ 
                  color: questionTimer.timeRemaining > 30 ? '#52c41a' : 
                        questionTimer.timeRemaining > 10 ? '#faad14' : '#ff4d4f'
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Interview Area */}
        <Row gutter={24} style={{ flex: 1, minHeight: 0 }}>
          <Col span={18}>
            <ChatInterface />
          </Col>
          <Col span={6}>
            <Space direction="vertical" size="large" style={{ width: '100%', height: '100%' }}>
              {/* Interview Configuration */}
              <Card title="Interview Details" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Type: </Text>
                    <Tag color="blue" style={{ textTransform: 'capitalize' }}>
                      {interviewType}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>Difficulty: </Text>
                    <Tag color="orange" style={{ textTransform: 'capitalize' }}>
                      {difficulty}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>Questions: </Text>
                    <Tag color="green">{progress.totalQuestions} Total</Tag>
                  </div>
                  <Button 
                    type="primary" 
                    danger 
                    icon={<StopOutlined />}
                    onClick={handleEndInterview}
                    block
                    style={{ marginTop: '16px' }}
                  >
                    End Interview
                  </Button>
                </Space>
              </Card>

              {/* Recent Activity */}
              <Card title="Recent Activity" size="small" style={{ flex: 1 }}>
                <Timeline
                  items={messages.slice(-4).map((msg: any) => ({
                    color: msg.type === 'ai' ? 'blue' : 'green',
                    children: (
                      <div key={msg.id}>
                        <Text strong style={{ fontSize: '12px' }}>
                          {msg.type === 'ai' ? '🤖 AI' : '👤 You'}
                          {msg.questionNumber && ` (Q${msg.questionNumber})`}
                        </Text>
                        <br />
                        <Text style={{ fontSize: '11px', color: '#666' }}>
                          {msg.content.length > 60 ? `${msg.content.substring(0, 60)}...` : msg.content}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              </Card>
            </Space>
          </Col>
        </Row>
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
                  <Option value={5}>5 Questions (Quick - 15 min)</Option>
                  <Option value={10}>10 Questions (Standard - 30 min)</Option>
                  <Option value={15}>15 Questions (Extended - 45 min)</Option>
                  <Option value={20}>20 Questions (Comprehensive - 60 min)</Option>
                </Select>
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
            icon={<PlayCircleOutlined />}
            onClick={handleStartInterview}
            disabled={!canStart}
            style={{ 
              height: '64px',
              fontSize: '18px',
              fontWeight: '700',
              paddingLeft: '48px',
              paddingRight: '48px',
              borderRadius: '16px',
              background: canStart 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#d9d9d9',
              border: 'none',
              boxShadow: canStart 
                ? '0 8px 24px rgba(102, 126, 234, 0.5)' 
                : 'none',
              transition: 'all 0.3s ease',
              cursor: canStart ? 'pointer' : 'not-allowed'
            }}
          >
            🚀 {canStart ? 'Start Interview Now' : 'Complete All Requirements Above'}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default IntervieweePage;