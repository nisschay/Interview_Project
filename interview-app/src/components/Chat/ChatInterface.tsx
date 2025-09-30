import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, List, Avatar, Typography, Spin, message, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  addMessage, 
  setMessages,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  
  const { 
    messages, 
    progress, 
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
    
    // Check if editing existing answer
    const existingMessageIndex = messages.findIndex(
      m => m.type === 'user' && m.questionNumber === currentQuestionNumber
    );

    if (existingMessageIndex >= 0) {
      // Update existing message (edit)
      const updatedMessages = [...messages];
      updatedMessages[existingMessageIndex] = {
        ...updatedMessages[existingMessageIndex],
        content: userAnswer,
        timestamp: new Date()
      };
      dispatch(setMessages(updatedMessages));
      message.success(`Answer updated for Question ${currentQuestionNumber}`);
    } else {
      // Add new message
      const userMessage = {
        type: 'user' as const,
        content: userAnswer,
        questionNumber: currentQuestionNumber
      };
      dispatch(addMessage(userMessage));
      message.success(`Answer saved for Question ${currentQuestionNumber}`);
    }

    setInputValue('');

    // Store answer in question object
    dispatch(updateQuestionAnswer({
      questionId: currentQ.id,
      answer: userAnswer
    }));
  };

  const endInterviewWithSummary = async () => {
    setIsTyping(true);
    message.info('Evaluating all your answers... This may take a moment.');
    
    try {
      let totalScore = 0;
      const maxScore = (4 * 1) + (4 * 3) + (2 * 5); // 4 easy + 4 medium + 2 hard = 26 points max
      const evaluatedQuestions: any[] = [];

      // Evaluate each answered question
      for (const question of allQuestions) {
        if (question.answer) {
          try {
            // Get AI evaluation
            const evaluation = await aiService.evaluateAnswer(
              question.question,
              question.answer,
              allQuestions.indexOf(question) + 1
            );

            // Calculate score based on difficulty
            const maxPoints = question.difficulty === 'hard' ? 5 : question.difficulty === 'medium' ? 3 : 1;
            let earnedPoints = 0;
            
            // Score based on evaluation quality
            if (evaluation.score >= 90) {
              earnedPoints = maxPoints; // 100% correct - full marks
            } else if (evaluation.score >= 60) {
              earnedPoints = maxPoints / 2; // Mostly correct - half marks
            } else if (evaluation.score >= 30) {
              earnedPoints = maxPoints / 4; // Partially correct - quarter marks
            }
            // else 0 points for very poor answers

            totalScore += earnedPoints;

            evaluatedQuestions.push({
              question: question.question,
              answer: question.answer,
              difficulty: question.difficulty,
              evaluation: evaluation.feedback,
              earnedPoints,
              maxPoints
            });

            // Update question with score
            dispatch(updateQuestionAnswer({
              questionId: question.id,
              answer: question.answer,
              score: Math.round((earnedPoints / maxPoints) * 100)
            }));
          } catch (error) {
            console.error('Error evaluating question:', error);
          }
        }
      }

      // Calculate percentage
      const percentageScore = Math.round((totalScore / maxScore) * 100);

      dispatch(endInterview({
        finalScore: percentageScore,
        summary: `Evaluated ${evaluatedQuestions.length} questions. Total score: ${totalScore}/${maxScore} points.`
      }));

      // Build detailed results message
      let resultsMessage = `🎉 **Interview Complete!**\n\n**Final Score: ${percentageScore}/100** (${totalScore}/${maxScore} points)\n\n`;
      
      resultsMessage += `**Question Breakdown:**\n`;
      evaluatedQuestions.forEach((eq, idx) => {
        const diffEmoji = eq.difficulty === 'easy' ? '🟢' : eq.difficulty === 'medium' ? '🟡' : '🔴';
        resultsMessage += `\n${diffEmoji} Q${idx + 1} (${eq.difficulty}): ${eq.earnedPoints}/${eq.maxPoints} points\n`;
        resultsMessage += `${eq.evaluation}\n`;
      });

      resultsMessage += `\n\n**Performance Summary:**\n`;
      if (percentageScore >= 80) {
        resultsMessage += `✅ Excellent! You demonstrated strong knowledge and skills.`;
      } else if (percentageScore >= 60) {
        resultsMessage += `✓ Good performance with room for improvement.`;
      } else if (percentageScore >= 40) {
        resultsMessage += `⚠️ Fair attempt. Consider reviewing key concepts.`;
      } else {
        resultsMessage += `❌ Needs improvement. Focus on fundamental concepts.`;
      }

      dispatch(addMessage({
        type: 'ai',
        content: resultsMessage
      }));

      message.success('Interview evaluation completed!');
    } catch (error) {
      console.error('Error generating summary:', error);
      dispatch(endInterview({}));
      
      dispatch(addMessage({
        type: 'ai',
        content: '🎉 **Interview Complete!**\n\nThank you for participating in this interview. Your responses have been recorded.'
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
    
    // Load existing answer into input if available
    const question = allQuestions[questionIndex];
    if (question?.answer) {
      setInputValue(question.answer);
    } else {
      setInputValue('');
    }
  };
  
  const handleEditAnswer = () => {
    const currentQ = allQuestions[currentQuestionNumber - 1];
    if (currentQ?.answer) {
      setInputValue(currentQ.answer);
      message.info('Edit your answer and click Send to update');
    }
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
        title={<span><ClockCircleOutlined /> Interview Status</span>}
        style={{ width: '320px', height: '100%', overflow: 'auto' }}
        bodyStyle={{ padding: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {/* Time Remaining */}
          <div style={{ marginBottom: '12px', padding: '12px', background: '#f0f2f5', borderRadius: '8px' }}>
            <Text strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Time Remaining</Text>
            <Text style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: overallTimer.timeRemaining < 300 ? '#ff4d4f' : '#52c41a'
            }}>
              {formatTimeRemaining(overallTimer.timeRemaining)}
            </Text>
          </div>

          {/* AI Interviewer Message */}
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: '13px', color: '#667eea' }}>
                <RobotOutlined /> AI Interviewer
              </Text>
              <Text style={{ fontSize: '12px', lineHeight: '1.5' }}>
                You have 38 minutes for 10 questions:
              </Text>
              <Text style={{ fontSize: '11px', color: '#666' }}>
                • 4 Easy (3 min each)<br />
                • 4 Medium (4 min each)<br />
                • 2 Hard (5 min each)
              </Text>
              <Text style={{ fontSize: '11px', marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
                💡 Navigate questions using the list below. Good luck!
              </Text>
            </Space>
          </div>

          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '12px' }}>
            <Text strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
              All Questions
            </Text>
          </div>
          
          {allQuestions.map((q, index) => {
            const isAnswered = !!q.answer;
            const isCurrent = index + 1 === currentQuestionNumber;
            const difficultyColor = q.difficulty === 'easy' ? '#52c41a' : q.difficulty === 'medium' ? '#faad14' : '#ff4d4f';
            const difficultyLabel = q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'medium' ? 'Med' : 'Hard';
            
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
                    <Tag color={difficultyColor} style={{ fontSize: '10px', padding: '0 6px' }}>
                      {difficultyLabel}
                    </Tag>
                    {isAnswered && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    {isCurrent && <EditOutlined style={{ color: '#667eea' }} />}
                  </Space>
                  {q.timeLimit && (
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      ⏱️ {Math.floor(q.timeLimit / 60)} min
                    </Text>
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
          {messages.filter(m => !m.questionNumber || m.questionNumber === currentQuestionNumber).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <RobotOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#667eea' }}>Question {currentQuestionNumber}</Title>
              <Text type="secondary">
                Type your answer below and click Send when ready.
              </Text>
            </div>
          ) : (
            <List
              dataSource={messages.filter(m => 
                !m.questionNumber || m.questionNumber === currentQuestionNumber
              )}
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
          
          {isTyping && (
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
                          Evaluating all answers...
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
          {/* Show current answer and edit button if question is already answered */}
          {allQuestions[currentQuestionNumber - 1]?.answer && (
            <div style={{ marginBottom: '12px' }}>
              <Space>
                <Text type="secondary">Current Answer:</Text>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={handleEditAnswer}
                  type="link"
                >
                  Edit Answer
                </Button>
              </Space>
              <div style={{
                padding: '12px',
                background: '#f0fdf4',
                borderRadius: '8px',
                marginTop: '8px',
                border: '1px solid #86efac',
                fontSize: '14px'
              }}>
                {allQuestions[currentQuestionNumber - 1].answer}
              </div>
            </div>
          )}
          
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
              disabled={isTyping}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
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