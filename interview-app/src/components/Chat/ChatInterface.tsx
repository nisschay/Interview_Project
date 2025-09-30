import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, List, Avatar, Typography, Spin, message, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  addMessage, 
  updateQuestionScore,
  endInterview,
  updateOverallTimer,
  navigateToQuestion,
  updateQuestionAnswer
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
    interviewType, 
    difficulty,
    currentQuestionNumber,
    allQuestions,
    overallTimer
  } = useSelector((state: RootState) => state.interview);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Overall timer management
  useEffect(() => {
    if (overallTimer.isActive && overallTimer.timeRemaining > 0) {
      timerRef.current = window.setTimeout(() => {
        dispatch(updateOverallTimer(overallTimer.timeRemaining - 1));
      }, 1000);
    } else if (overallTimer.isActive && overallTimer.timeRemaining === 0) {
      // Time's up - end interview
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [overallTimer.timeRemaining, overallTimer.isActive]);

  const handleTimeUp = async () => {
    message.warning('Time is up! The interview has ended.');
    endInterviewWithSummary();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userAnswer = inputValue.trim();
    const currentQ = allQuestions[currentQuestionNumber - 1];
    
    if (!currentQ) return;
    
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
      const evaluation = await aiService.evaluateAnswer(
        currentQ.question,
        userAnswer,
        currentQuestionNumber,
        difficulty
      );

      // Update the question with answer and score
      dispatch(updateQuestionAnswer({
        questionId: currentQ.id,
        answer: userAnswer,
        score: evaluation.score
      }));

      // Update overall score
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

      message.success(`Question ${currentQuestionNumber} answered! Score: ${evaluation.score}/100`);
      
    } catch (error) {
      console.error('Error evaluating answer:', error);
      message.error('Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const endInterviewWithSummary = async () => {
    setIsTyping(true);
    
    try {
      const summary = await aiService.generateFinalSummary(
        messages,
        { name: 'Candidate' },
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
  
  const handleQuestionClick = (questionIndex: number) => {
    dispatch(navigateToQuestion(questionIndex + 1));
  };
  
  const handleEndInterview = () => {
    endInterviewWithSummary();
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
      {/* Questions Sidebar */}
      <Card 
        title={<span><ClockCircleOutlined /> All Questions</span>}
        style={{ width: '300px', height: '100%', overflow: 'auto' }}
        bodyStyle={{ padding: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ marginBottom: '12px', padding: '8px', background: '#f0f2f5', borderRadius: '8px' }}>
            <Text strong style={{ display: 'block', marginBottom: '4px' }}>Time Remaining</Text>
            <Text style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: overallTimer.timeRemaining < 300 ? '#ff4d4f' : '#52c41a'
            }}>
              {formatTimeRemaining(overallTimer.timeRemaining)}
            </Text>
          </div>
          
          {allQuestions.map((q, index) => {
            const isAnswered = !!q.answer;
            const isCurrent = index + 1 === currentQuestionNumber;
            
            return (
              <Card
                key={q.id}
                size="small"
                hoverable={!isCurrent}
                onClick={() => !isCurrent && handleQuestionClick(index)}
                style={{
                  cursor: isCurrent ? 'default' : 'pointer',
                  borderColor: isCurrent ? '#667eea' : isAnswered ? '#52c41a' : '#d9d9d9',
                  borderWidth: isCurrent ? '2px' : '1px',
                  background: isCurrent ? '#f0f5ff' : isAnswered ? '#f6ffed' : 'white'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size={4}>
                  <Space>
                    <Text strong>Q{index + 1}</Text>
                    {isAnswered && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    {isCurrent && <EditOutlined style={{ color: '#667eea' }} />}
                  </Space>
                  {isAnswered && q.score !== undefined && (
                    <Tag color={q.score >= 70 ? 'success' : q.score >= 40 ? 'warning' : 'error'}>
                      Score: {q.score}/100
                    </Tag>
                  )}
                </Space>
              </Card>
            );
          })}
          
          <Button 
            type="primary" 
            danger 
            block 
            onClick={handleEndInterview}
            style={{ marginTop: '12px' }}
          >
            End Interview
          </Button>
        </Space>
      </Card>

      {/* Chat Interface */}
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
              AI Interview Chat - Question {currentQuestionNumber}/{progress.totalQuestions}
            </span>
          </Space>
        }
        style={{ 
          flex: 1,
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
        {/* Current Question Display */}
        {allQuestions[currentQuestionNumber - 1] && (
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderBottom: '2px solid rgba(102, 126, 234, 0.2)'
          }}>
            <Text strong style={{ fontSize: '16px', color: '#667eea' }}>
              Current Question:
            </Text>
            <div style={{ 
              marginTop: '12px',
              padding: '16px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              fontSize: '15px',
              lineHeight: '1.6'
            }}>
              {allQuestions[currentQuestionNumber - 1].question}
            </div>
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
                You have {overallTimer.totalMinutes} minutes for {progress.totalQuestions} questions. Answer them in any order using the sidebar!
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
                          {isEvaluating ? 'Evaluating your answer...' : 'Processing...'}
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
              disabled={isTyping || isEvaluating}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping || isEvaluating}
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
    </div>
  );
};

export default ChatInterface;