import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, List, Avatar, Typography, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { addMessage, setCurrentQuestion } from '../../store/slices/interviewSlice';
import type { Message } from '../../store/slices/interviewSlice';
import aiService from '../../services/aiService';

const { TextArea } = Input;
const { Text, Title } = Typography;

const ChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, progress, resumeContent, jobDescription, interviewType, difficulty } = useSelector(
    (state: RootState) => state.interview
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    dispatch(addMessage({
      type: 'user',
      content: inputValue,
    }));

    setInputValue('');
    setIsTyping(true);

    // Get previous questions for context
    const previousQuestions = messages
      .filter(msg => msg.type === 'ai')
      .map(msg => msg.content);

    // Generate AI response using Gemini
    try {
      const response = await aiService.generateQuestion(
        resumeContent,
        jobDescription,
        interviewType,
        difficulty,
        previousQuestions
      );
      
      setTimeout(() => {
        dispatch(addMessage({
          type: 'ai',
          content: response.content,
        }));
        
        dispatch(setCurrentQuestion(response.content));
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setTimeout(() => {
        const fallbackResponses = [
          "Thank you for that answer. Can you elaborate on your experience with this technology?",
          "Interesting approach! How would you handle potential challenges with this solution?",
          "Good explanation. What other alternatives did you consider?",
          "That's a solid foundation. How would you scale this for production use?"
        ];
        const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        dispatch(addMessage({
          type: 'ai',
          content: fallbackResponse,
        }));
        
        dispatch(setCurrentQuestion(fallbackResponse));
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
          <Text type="secondary">({progress.questionsAsked}/{progress.totalQuestions})</Text>
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
            <Text type="secondary">The AI interviewer will ask you questions based on your resume and the job description.</Text>
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
                      <Text strong>{message.type === 'ai' ? 'AI Interviewer' : 'You'}</Text>
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
                      <Text style={{ color: '#374151' }}>{message.content}</Text>
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
                title={<Text strong>AI Interviewer</Text>}
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
                      <Text type="secondary" style={{ fontSize: '15px' }}>AI is thinking...</Text>
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
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
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
  );
};

export default ChatInterface;