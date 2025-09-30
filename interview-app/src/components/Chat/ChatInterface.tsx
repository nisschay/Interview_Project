import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, List, Avatar, Typography, Spin, Progress, message, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  addMessage, 
  setCurrentQuestion, 
  updateTimer, 
  updateQuestionScore,
  endInterview 
} from '../../store/slices/interviewSlice';
import type { Message } from '../../types';
import aiService from '../../services/aiService';

const { TextArea } = Input;
const { Text, Title } = Typography;

const ChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  
  const { 
    messages, 
    progress, 
    resumeContent, 
    jobDescription, 
    interviewType, 
    difficulty,
    questionTimer,
    currentQuestion,
    currentQuestionNumber
  } = useSelector((state: RootState) => state.interview);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Timer management
  useEffect(() => {
    if (questionTimer.isActive && questionTimer.timeRemaining > 0) {
      timerRef.current = window.setTimeout(() => {
        dispatch(updateTimer(questionTimer.timeRemaining - 1));
      }, 1000);
    } else if (questionTimer.isActive && questionTimer.timeRemaining === 0) {
      // Time's up - auto submit answer
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [questionTimer.timeRemaining, questionTimer.isActive]);

  const handleTimeUp = async () => {
    if (inputValue.trim()) {
      // Auto-submit the current answer
      await handleSendMessage(true);
    } else {
      // No answer provided
      dispatch(addMessage({
        type: 'user',
        content: '[No answer provided - time expired]'
      }));
      
      setTimeout(() => {
        generateNextQuestion();
      }, 1000);
    }
  };

  const handleSendMessage = async (isAutoSubmit = false) => {
    if (!inputValue.trim() && !isAutoSubmit) return;

    const userAnswer = inputValue.trim() || '[No answer provided]';
    
    // Add user message
    const userMessage = {
      type: 'user' as const,
      content: userAnswer,
      questionNumber: currentQuestionNumber
    };
    dispatch(addMessage(userMessage));

    setInputValue('');
    setIsEvaluating(true);

    try {
      // Evaluate the answer
      if (currentQuestion) {
        const evaluation = await aiService.evaluateAnswer(
          currentQuestion,
          userAnswer,
          currentQuestionNumber,
          difficulty
        );

        // Update the score for this question
        dispatch(updateQuestionScore({
          questionId: Date.now().toString(),
          score: evaluation.score
        }));

        // Add AI feedback
        const feedbackMessage = `**Score: ${evaluation.score}/100**\n\n${evaluation.feedback}\n\n**Strengths:**\n${evaluation.strengths.map(s => `• ${s}`).join('\n')}\n\n**Suggestions:**\n${evaluation.suggestions.map(s => `• ${s}`).join('\n')}`;
        
        dispatch(addMessage({
          type: 'ai',
          content: feedbackMessage,
          score: evaluation.score
        }));

        setTimeout(() => {
          setIsEvaluating(false);
          generateNextQuestion();
        }, 2000);
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setIsEvaluating(false);
      generateNextQuestion();
    }
  };

  const generateNextQuestion = async () => {
    // Check if interview should end
    if (currentQuestionNumber >= progress.totalQuestions) {
      endInterviewWithSummary();
      return;
    }

    setIsTyping(true);

    try {
      // Get previous questions for context
      const previousQuestions = messages
        .filter(msg => msg.type === 'ai' && !msg.content.includes('Score:'))
        .map(msg => msg.content);

      const response = await aiService.generateQuestion(
        resumeContent,
        jobDescription,
        interviewType,
        difficulty,
        previousQuestions,
        currentQuestionNumber + 1
      );
      
      setTimeout(() => {
        dispatch(setCurrentQuestion({ 
          question: response.content,
          timeLimit: getTimeLimitForDifficulty(difficulty)
        }));
        
        dispatch(addMessage({
          type: 'ai',
          content: response.content,
          questionNumber: currentQuestionNumber + 1
        }));
        
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating question:', error);
      setTimeout(() => {
        const fallbackQuestion = getFallbackQuestion(currentQuestionNumber + 1, interviewType);
        
        dispatch(setCurrentQuestion({ 
          question: fallbackQuestion,
          timeLimit: getTimeLimitForDifficulty(difficulty)
        }));
        
        dispatch(addMessage({
          type: 'ai',
          content: fallbackQuestion,
          questionNumber: currentQuestionNumber + 1
        }));
        
        setIsTyping(false);
      }, 1500);
    }
  };

  const endInterviewWithSummary = async () => {
    setIsTyping(true);
    
    try {
      const summary = await aiService.generateFinalSummary(
        messages,
        { name: 'Candidate' }, // We'll get this from parsed resume data later
        { type: interviewType, difficulty }
      );

      dispatch(endInterview({
        finalScore: summary.overallScore,
        summary: summary.summary
      }));

      const finalMessage = `🎉 **Interview Complete!**\n\n**Final Score: ${summary.overallScore}/100**\n\n**Summary:**\n${summary.summary}\n\n**Key Strengths:**\n${summary.strengths.map(s => `• ${s}`).join('\n')}\n\n**Areas for Improvement:**\n${summary.improvements.map(i => `• ${i}`).join('\n')}\n\n**Recommendation:** ${summary.recommendation}`;

      dispatch(addMessage({
        type: 'ai',
        content: finalMessage
      }));

      message.success('Interview completed! Check the Interviewer Dashboard for detailed results.');
    } catch (error) {
      console.error('Error generating summary:', error);
      dispatch(endInterview({}));
      
      dispatch(addMessage({
        type: 'ai',
        content: '🎉 **Interview Complete!**\n\nThank you for participating in this interview. Your responses have been recorded and will be reviewed.'
      }));
    }
    
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTimeLimitForDifficulty = (diff: string): number => {
    switch (diff) {
      case 'junior': return 20;
      case 'mid': return 60;
      case 'senior': return 120;
      default: return 60;
    }
  };

  const getFallbackQuestion = (questionNum: number, type: string): string => {
    const fallbacks = {
      technical: [
        "Can you explain your experience with JavaScript and any frameworks you've used?",
        "How do you approach debugging when you encounter a problem in your code?",
        "What's your experience with databases and how do you optimize queries?",
        "How do you ensure code quality and what testing practices do you follow?",
        "Can you describe a challenging technical problem you solved recently?"
      ],
      behavioral: [
        "Tell me about a time you had to work under a tight deadline.",
        "How do you handle feedback and criticism from team members?",
        "Describe a situation where you had to learn something new quickly.",
        "Tell me about a time you disagreed with a team decision.",
        "How do you prioritize your work when facing multiple deadlines?"
      ],
      mixed: [
        "How do you balance technical excellence with meeting business requirements?",
        "Describe your experience working in agile development environments.",
        "How do you communicate technical concepts to non-technical stakeholders?",
        "Tell me about a time you had to mentor a junior developer.",
        "How do you stay updated with new technologies while maintaining current projects?"
      ]
    };
    
    const questions = fallbacks[type as keyof typeof fallbacks] || fallbacks.technical;
    return questions[Math.min(questionNum - 1, questions.length - 1)];
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (timeRemaining: number, timeLimit: number): string => {
    const percentage = (timeRemaining / timeLimit) * 100;
    if (percentage > 60) return '#52c41a';
    if (percentage > 30) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Card 
      title={
        <Space>
          <RobotOutlined style={{ color: '#667eea' }} />
          <span style={{ 
            fontSize: '18px',
            fontWeight: 600,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Interview Chat
          </span>
          <Text type="secondary">
            Question {currentQuestionNumber}/{progress.totalQuestions}
          </Text>
          {questionTimer.isActive && (
            <Space>
              <ClockCircleOutlined style={{ color: getTimerColor(questionTimer.timeRemaining, questionTimer.timeLimit) }} />
              <Text style={{ 
                color: getTimerColor(questionTimer.timeRemaining, questionTimer.timeLimit),
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {formatTimeRemaining(questionTimer.timeRemaining)}
              </Text>
            </Space>
          )}
        </Space>
      }
      style={{ 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.1)'
      }}
      bodyStyle={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0,
        minHeight: 0
      }}
    >
      {/* Timer Progress Bar */}
      {questionTimer.isActive && (
        <div style={{ padding: '0 16px' }}>
          <Progress
            percent={Math.round((questionTimer.timeRemaining / questionTimer.timeLimit) * 100)}
            strokeColor={getTimerColor(questionTimer.timeRemaining, questionTimer.timeLimit)}
            showInfo={false}
            size="small"
          />
        </div>
      )}

      <div style={{ 
        flex: 1, 
        padding: 16, 
        overflow: 'auto',
        minHeight: 0
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <RobotOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Welcome to your AI Interview!</Title>
            <Text type="secondary">
              The AI interviewer will ask you {progress.totalQuestions} questions based on your resume and the job description.
            </Text>
          </div>
        ) : (
          <List
            dataSource={messages}
            renderItem={(message: Message) => (
              <List.Item style={{ border: 'none', padding: '8px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={message.type === 'ai' ? <RobotOutlined /> : <UserOutlined />}
                      style={{ 
                        backgroundColor: message.type === 'ai' ? '#1890ff' : '#52c41a'
                      }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{message.type === 'ai' ? '🤖 AI Interviewer' : '👤 You'}</Text>
                      {message.questionNumber && (
                        <Tag>Q{message.questionNumber}</Tag>
                      )}
                      {message.score && (
                        <Tag color={message.score >= 80 ? 'green' : message.score >= 60 ? 'orange' : 'red'}>
                          {message.score}/100
                        </Tag>
                      )}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    </Space>
                  }
                  description={
                    <div style={{ 
                      background: message.type === 'ai' 
                        ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' 
                        : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      marginTop: 8,
                      border: message.type === 'ai' 
                        ? '1px solid rgba(102, 126, 234, 0.2)' 
                        : '1px solid rgba(34, 197, 94, 0.2)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      fontSize: '15px',
                      lineHeight: '1.6'
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {message.content.split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
        
        {(isTyping || isEvaluating) && (
          <div style={{ padding: '8px 0' }}>
            <List.Item style={{ border: 'none' }}>
              <List.Item.Meta
                avatar={<Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                title={<Text strong>🤖 AI Interviewer</Text>}
                description={
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <Space>
                      <Spin size="small" style={{ color: '#667eea' }} />
                      <Text type="secondary" style={{ fontSize: '15px' }}>
                        {isEvaluating ? 'Evaluating your answer...' : 'Generating next question...'}
                      </Text>
                    </Space>
                  </div>
                }
              />
            </List.Item>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ 
        padding: '20px', 
        borderTop: '1px solid rgba(102, 126, 234, 0.1)',
        background: 'linear-gradient(135deg, #fafbff 0%, #f8fafc 100%)',
        borderRadius: '0 0 16px 16px'
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer here... (Press Enter to send)"
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ 
              resize: 'none',
              borderRadius: '12px 0 0 12px',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              fontSize: '15px',
              padding: '12px 16px'
            }}
            disabled={isTyping || isEvaluating || !questionTimer.isActive}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping || isEvaluating || !questionTimer.isActive}
            size="large"
            style={{
              borderRadius: '0 12px 12px 0',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              border: 'none',
              height: 'auto',
              minHeight: '50px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '24px',
              paddingRight: '24px'
            }}
          >
            Send
          </Button>
        </Space.Compact>
      </div>
    </Card>
  );
};

export default ChatInterface;